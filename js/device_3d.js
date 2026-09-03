/**
 * 3D Device & Holographic Studio
 * Powered by Three.js & OrbitControls (100% Local Bundle)
 */
class Device3DStudio {
  constructor(container, screenCanvas, onScreenInteraction) {
    this.container = container;
    this.screenCanvas = screenCanvas;
    this.onScreenInteraction = onScreenInteraction;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.phoneGroup = null;
    this.screenMesh = null;
    this.screenTexture = null;
    this.holoGroup = null;
    this.particles = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.isInteractingScreen = false;
    this.autoRotate = true;
    this.time = 0;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070d);
    this.scene.fog = new THREE.FogExp2(0x05070d, 0.035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 11.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 22;
      this.controls.minDistance = 4;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Cyber Environment
    this.setupEnvironment();

    // 7. 3D Smartphone
    this.buildPhoneDevice();

    // 8. 3D Hologram Projection
    this.buildHologramEmitter();

    // 9. Event Listeners for Raycasting & Resize
    this.bindEvents();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x0f172a, 1.2);
    this.scene.add(ambient);

    // Cyan Key Light
    const cyanLight = new THREE.DirectionalLight(0x00f5ff, 2.0);
    cyanLight.position.set(8, 12, 10);
    cyanLight.castShadow = true;
    this.scene.add(cyanLight);

    // Magenta Fill Light
    const magentaLight = new THREE.DirectionalLight(0xff007f, 1.5);
    magentaLight.position.set(-8, -6, 6);
    this.scene.add(magentaLight);

    // Screen Core Glow Point Light
    this.screenGlow = new THREE.PointLight(0x00f5ff, 1.8, 6);
    this.screenGlow.position.set(0, 0, 1.5);
    this.scene.add(this.screenGlow);
  }

  setupEnvironment() {
    // Cyber Grid Floor using custom LineSegments (compatible with minimal Three.js)
    const gridLines = [];
    const size = 20;
    const step = 2;
    for (let i = -size; i <= size; i += step) {
      gridLines.push(-size, -4.5, i, size, -4.5, i);
      gridLines.push(i, -4.5, -size, i, -4.5, size);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridLines, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.3
    });
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    this.scene.add(grid);

    // Dark Reflective Ground Plane
    const planeGeo = new THREE.PlaneGeometry(60, 60);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x030509,
      roughness: 0.2,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.51;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floating Cyber Dust Particles
    const pCount = 500;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.0 : 1.0;
      colors[i * 3 + 1] = isCyan ? 0.95 : 0.0;
      colors[i * 3 + 2] = isCyan ? 1.0 : 0.5;
    }

    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particles);
  }

  buildPhoneDevice() {
    this.phoneGroup = new THREE.Group();

    const w = 3.6;
    const h = 7.4;
    const d = 0.28;

    // 1. Titanium Chassis
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      metalness: 0.92,
      roughness: 0.22
    });
    const phoneBody = new THREE.Mesh(bodyGeo, bodyMat);
    phoneBody.castShadow = true;
    this.phoneGroup.add(phoneBody);

    // 2. Neon Bezel Edge Accent
    const edgeGeo = new THREE.BoxGeometry(w + 0.04, h + 0.04, d * 0.4);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });
    const edgeStrip = new THREE.Mesh(edgeGeo, edgeMat);
    this.phoneGroup.add(edgeStrip);

    // 3. Screen Canvas Texture & Mesh
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;
    this.screenTexture.generateMipmaps = false;

    const screenGeo = new THREE.PlaneGeometry(w - 0.16, h - 0.28);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false
    });
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.z = d / 2 + 0.002;
    this.phoneGroup.add(this.screenMesh);

    // 4. Glass Face Cover (Subtle specular shine via MeshStandardMaterial)
    const glassGeo = new THREE.PlaneGeometry(w - 0.06, h - 0.14);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      opacity: 0.15,
      transparent: true,
      roughness: 0.1,
      metalness: 0.3
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = d / 2 + 0.005;
    this.phoneGroup.add(glassMesh);

    // 5. Back Camera Island
    const bumpGeo = new THREE.BoxGeometry(1.4, 2.2, 0.12);
    const bumpMat = new THREE.MeshStandardMaterial({
      color: 0x161b22,
      metalness: 0.8,
      roughness: 0.3
    });
    const bump = new THREE.Mesh(bumpGeo, bumpMat);
    bump.position.set(-w / 4, h / 4, -d / 2 - 0.06);
    this.phoneGroup.add(bump);

    // Triple Lenses
    for (let i = 0; i < 3; i++) {
      const lensGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 24);
      lensGeo.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        metalness: 0.95,
        roughness: 0.1
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(-w / 4, h / 4 + 0.65 - i * 0.65, -d / 2 - 0.12);
      this.phoneGroup.add(lens);
    }

    // Side Power Button
    const btnGeo = new THREE.BoxGeometry(0.04, 0.8, 0.1);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 0.5 });
    const pwrBtn = new THREE.Mesh(btnGeo, btnMat);
    pwrBtn.position.set(w / 2 + 0.02, 1.2, 0);
    this.phoneGroup.add(pwrBtn);

    // Initial rotation tilt
    this.phoneGroup.rotation.y = -0.35;
    this.phoneGroup.rotation.x = 0.15;

    this.scene.add(this.phoneGroup);
  }

  buildHologramEmitter() {
    this.holoGroup = new THREE.Group();

    // 1. Hologram Cone Beam
    const coneGeo = new THREE.ConeGeometry(3.5, 4.5, 32, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 2.25);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending
    });
    this.holoCone = new THREE.Mesh(coneGeo, coneMat);
    this.holoGroup.add(this.holoCone);

    // 2. Floating Holographic Rings
    this.rings = [];
    [1.2, 1.8, 2.4].forEach((rad, idx) => {
      const ringGeo = new THREE.RingGeometry(rad, rad + 0.04, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x00f5ff : 0xff007f,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = 1.2 + idx * 0.8;
      this.rings.push(ring);
      this.holoGroup.add(ring);
    });

    // 3. Holographic Floating Gyro Cube
    const cubeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const cubeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.holoCube = new THREE.Mesh(cubeGeo, cubeMat);
    this.holoCube.position.z = 2.8;
    this.holoGroup.add(this.holoCube);

    this.phoneGroup.add(this.holoGroup);
  }

  setHoloColor(hexColor) {
    if (this.screenGlow) this.screenGlow.color.setHex(hexColor);
    if (this.holoCone) this.holoCone.material.color.setHex(hexColor);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    const dom = this.renderer.domElement;

    // Mouse / Touch Raycasting
    dom.addEventListener('pointerdown', (e) => this.handlePointer(e, 'down'));
    dom.addEventListener('pointermove', (e) => this.handlePointer(e, 'move'));
    window.addEventListener('pointerup', (e) => this.handlePointer(e, 'up'));
  }

  handlePointer(e, type) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.screenMesh);

    if (hits.length > 0 && hits[0].uv) {
      const uv = hits[0].uv;
      const screenX = uv.x * this.screenCanvas.width;
      const screenY = (1 - uv.y) * this.screenCanvas.height;

      if (type === 'down') {
        this.isInteractingScreen = true;
        if (this.controls) this.controls.enabled = false;
        this.autoRotate = false;
      }

      if (this.onScreenInteraction) {
        this.onScreenInteraction(type, screenX, screenY, e.button === 2);
      }
    } else {
      if (type === 'up' && this.isInteractingScreen) {
        this.isInteractingScreen = false;
        if (this.controls) this.controls.enabled = true;
        if (this.onScreenInteraction) {
          this.onScreenInteraction('up', 0, 0, false);
        }
      }
    }

    if (type === 'up') {
      this.isInteractingScreen = false;
      if (this.controls) this.controls.enabled = true;
      if (this.onScreenInteraction) {
        this.onScreenInteraction('up', 0, 0, false);
      }
    }
  }

  onResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() {
    this.time += 0.015;

    // Update canvas texture
    if (this.screenTexture) {
      this.screenTexture.needsUpdate = true;
    }

    // Auto rotate phone when idle
    if (this.autoRotate && this.phoneGroup) {
      this.phoneGroup.rotation.y = Math.sin(this.time * 0.4) * 0.4;
      this.phoneGroup.position.y = Math.sin(this.time * 0.8) * 0.2;
    }

    // Animate Holographic Projection
    if (this.holoGroup) {
      this.rings.forEach((r, idx) => {
        r.rotation.z += (idx % 2 === 0 ? 0.02 : -0.015);
      });
      if (this.holoCube) {
        this.holoCube.rotation.x += 0.02;
        this.holoCube.rotation.y += 0.03;
      }
    }

    // Animate Dust Particles
    if (this.particles) {
      this.particles.rotation.y = this.time * 0.02;
    }

    // Controls update
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Device3DStudio = Device3DStudio;
