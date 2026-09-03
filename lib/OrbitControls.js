/**
 * Three.js OrbitControls Standalone
 * Smooth orbital camera manipulation for Sekigahara 3D
 */
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('./three.min.js'));
  } else if (typeof define === 'function' && define.amd) {
    define(['three'], factory);
  } else {
    factory(global.THREE);
  }
})(typeof self !== 'undefined' ? self : this, function (THREE) {
  'use strict';

  if (!THREE) {
    if (typeof window !== 'undefined' && window.THREE) THREE = window.THREE;
    else if (typeof global !== 'undefined' && global.THREE) THREE = global.THREE;
  }

  const _changeEvent = { type: 'change' };
  const _startEvent = { type: 'start' };
  const _endEvent = { type: 'end' };

  class OrbitControls extends THREE.EventDispatcher {
    constructor(object, domElement) {
      super();
      this.object = object;
      this.domElement = domElement;

      this.enabled = true;
      this.target = new THREE.Vector3();

      this.minDistance = 10;
      this.maxDistance = 1200;

      this.minPolarAngle = 0.05;
      this.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go below ground

      this.minAzimuthAngle = -Infinity;
      this.maxAzimuthAngle = Infinity;

      this.enableDamping = true;
      this.dampingFactor = 0.05;

      this.enableZoom = true;
      this.zoomSpeed = 1.0;

      this.enableRotate = true;
      this.rotateSpeed = 1.0;

      this.enablePan = true;
      this.panSpeed = 1.0;
      this.screenSpacePanning = true;

      this.autoRotate = false;
      this.autoRotateSpeed = 2.0;

      // Internal State
      this._state = -1; // -1: NONE, 0: ROTATE, 1: DOLLY, 2: PAN
      this._spherical = { radius: 100, theta: 0, phi: Math.PI / 4 };
      this._sphericalDelta = { radius: 0, theta: 0, phi: 0 };
      this._panOffset = new THREE.Vector3();
      this._rotateStart = new THREE.Vector2();
      this._rotateEnd = new THREE.Vector2();
      this._rotateDelta = new THREE.Vector2();
      this._panStart = new THREE.Vector2();
      this._panEnd = new THREE.Vector2();
      this._panDelta = new THREE.Vector2();
      this._zoomStart = new THREE.Vector2();
      this._zoomEnd = new THREE.Vector2();
      this._zoomDelta = new THREE.Vector2();

      this._pointerDownHandler = this.onPointerDown.bind(this);
      this._pointerMoveHandler = this.onPointerMove.bind(this);
      this._pointerUpHandler = this.onPointerUp.bind(this);
      this._wheelHandler = this.onMouseWheel.bind(this);
      this._contextMenuHandler = this.onContextMenu.bind(this);

      if (this.domElement) {
        this.domElement.addEventListener('pointerdown', this._pointerDownHandler);
        this.domElement.addEventListener('wheel', this._wheelHandler, { passive: false });
        this.domElement.addEventListener('contextmenu', this._contextMenuHandler);
        if (typeof window !== 'undefined') {
          window.addEventListener('pointermove', this._pointerMoveHandler);
          window.addEventListener('pointerup', this._pointerUpHandler);
        }
      }

      this.updateInitialSpherical();
    }

    updateInitialSpherical() {
      if (!this.object) return;
      const offset = new THREE.Vector3().subVectors(this.object.position, this.target);
      this._spherical.radius = offset.length() || 100;
      this._spherical.theta = Math.atan2(offset.x, offset.z);
      this._spherical.phi = Math.acos(THREE.MathUtils.clamp(offset.y / this._spherical.radius, -1, 1));
    }

    update() {
      if (!this.object) return;

      const offset = new THREE.Vector3().subVectors(this.object.position, this.target);

      // Auto rotation
      if (this.autoRotate && this._state === -1) {
        this.rotateLeft(THREE.MathUtils.degToRad(this.autoRotateSpeed / 60));
      }

      if (this.enableDamping) {
        this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
        this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
        this._spherical.radius += this._sphericalDelta.radius * this.dampingFactor;

        this.target.addScaledVector(this._panOffset, this.dampingFactor);

        this._sphericalDelta.theta *= (1 - this.dampingFactor);
        this._sphericalDelta.phi *= (1 - this.dampingFactor);
        this._sphericalDelta.radius *= (1 - this.dampingFactor);
        this._panOffset.multiplyScalar(1 - this.dampingFactor);
      } else {
        this._spherical.theta += this._sphericalDelta.theta;
        this._spherical.phi += this._sphericalDelta.phi;
        this._spherical.radius += this._sphericalDelta.radius;

        this.target.add(this._panOffset);

        this._sphericalDelta.theta = 0;
        this._sphericalDelta.phi = 0;
        this._sphericalDelta.radius = 0;
        this._panOffset.set(0, 0, 0);
      }

      // Restrict phi and radius
      this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
      this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));

      // Calculate new camera position
      const sinPhiRadius = Math.sin(this._spherical.phi) * this._spherical.radius;
      offset.x = sinPhiRadius * Math.sin(this._spherical.theta);
      offset.y = Math.cos(this._spherical.phi) * this._spherical.radius;
      offset.z = sinPhiRadius * Math.cos(this._spherical.theta);

      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);

      this.dispatchEvent(_changeEvent);
    }

    rotateLeft(angle) { this._sphericalDelta.theta -= angle; }
    rotateUp(angle) { this._sphericalDelta.phi -= angle; }

    pan(deltaX, deltaY) {
      const element = this.domElement;
      if (!element) return;
      const height = element.clientHeight || 500;
      const targetDistance = this._spherical.radius * Math.tan(THREE.MathUtils.degToRad((this.object.fov || 50) / 2));
      const factorX = (2 * deltaX * targetDistance) / height;
      const factorY = (2 * deltaY * targetDistance) / height;

      const vLeft = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.object.quaternion);
      const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.object.quaternion);

      this._panOffset.addScaledVector(vLeft, factorX);
      this._panOffset.addScaledVector(vUp, factorY);
    }

    dollyIn(dollyScale) {
      this._sphericalDelta.radius += (dollyScale - 1) * this._spherical.radius;
    }
    dollyOut(dollyScale) {
      this._sphericalDelta.radius += (1 - dollyScale) * this._spherical.radius;
    }

    onPointerDown(event) {
      if (!this.enabled) return;
      if (event.button === 0) {
        this._state = 0; // ROTATE
        this._rotateStart.set(event.clientX, event.clientY);
      } else if (event.button === 2) {
        this._state = 2; // PAN
        this._panStart.set(event.clientX, event.clientY);
      }
      this.dispatchEvent(_startEvent);
    }

    onPointerMove(event) {
      if (!this.enabled || this._state === -1) return;
      if (this._state === 0 && this.enableRotate) {
        this._rotateEnd.set(event.clientX, event.clientY);
        this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
        const element = this.domElement || { clientWidth: 800, clientHeight: 600 };
        this.rotateLeft(2 * Math.PI * this._rotateDelta.x / element.clientWidth);
        this.rotateUp(2 * Math.PI * this._rotateDelta.y / element.clientHeight);
        this._rotateStart.copy(this._rotateEnd);
        this.update();
      } else if (this._state === 2 && this.enablePan) {
        this._panEnd.set(event.clientX, event.clientY);
        this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
        this.pan(this._panDelta.x, this._panDelta.y);
        this._panStart.copy(this._panEnd);
        this.update();
      }
    }

    onPointerUp(event) {
      if (!this.enabled) return;
      this._state = -1;
      this.dispatchEvent(_endEvent);
    }

    onMouseWheel(event) {
      if (!this.enabled || !this.enableZoom) return;
      event.preventDefault();
      if (event.deltaY < 0) {
        this.dollyIn(0.9);
      } else if (event.deltaY > 0) {
        this.dollyOut(0.9);
      }
      this.update();
    }

    onContextMenu(event) {
      if (this.enabled) event.preventDefault();
    }

    dispose() {
      if (this.domElement) {
        this.domElement.removeEventListener('pointerdown', this._pointerDownHandler);
        this.domElement.removeEventListener('wheel', this._wheelHandler);
        this.domElement.removeEventListener('contextmenu', this._contextMenuHandler);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointermove', this._pointerMoveHandler);
        window.removeEventListener('pointerup', this._pointerUpHandler);
      }
      this.dispatchEvent({ type: 'dispose' });
    }
  }

  THREE.OrbitControls = OrbitControls;
  return OrbitControls;
});
