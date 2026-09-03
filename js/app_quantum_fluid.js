/**
 * App 1: Quantum Fluid & Gravity Sand
 * High-performance 2D particle dynamics with gravity, vortex attractor & gyro tilt.
 */
class QuantumFluidApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 3200;
    this.width = canvas.width;
    this.height = canvas.height;

    // Forces
    this.gravity = { x: 0, y: 0.35 };
    this.pointer = { x: this.width / 2, y: this.height / 2, active: false, mode: 'attract' };
    this.shockwaves = [];

    // Themes
    this.colorThemes = [
      { name: 'Cyber Neon', low: [0, 245, 255], mid: [168, 85, 247], high: [255, 0, 128] },
      { name: 'Solar Flare', low: [234, 179, 8], mid: [249, 115, 22], high: [239, 68, 68] },
      { name: 'Toxic Emerald', low: [34, 197, 94], mid: [16, 185, 129], high: [250, 204, 21] },
      { name: 'Deep Void', low: [99, 102, 241], mid: [192, 132, 252], high: [244, 114, 182] }
    ];
    this.themeIndex = 0;

    this.initParticles();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  initParticles() {
    this.particles = new Float32Array(this.numParticles * 4); // x, y, vx, vy
    for (let i = 0; i < this.numParticles; i++) {
      const idx = i * 4;
      this.particles[idx] = Math.random() * this.width;
      this.particles[idx + 1] = Math.random() * this.height;
      this.particles[idx + 2] = (Math.random() - 0.5) * 2;
      this.particles[idx + 3] = (Math.random() - 0.5) * 2;
    }
  }

  setGravity(gx, gy) {
    this.gravity.x = gx;
    this.gravity.y = gy;
  }

  cycleTheme() {
    this.themeIndex = (this.themeIndex + 1) % this.colorThemes.length;
    if (window.CyberAudio) window.CyberAudio.playTap(900);
    return this.colorThemes[this.themeIndex].name;
  }

  triggerShockwave(x, y) {
    this.shockwaves.push({ x, y, radius: 5, maxRadius: 180, alpha: 1.0, power: 18 });
    if (window.CyberAudio) window.CyberAudio.playDrum('zap');
  }

  handlePointerDown(x, y, isRightClick = false) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = true;
    this.pointer.mode = isRightClick ? 'repel' : 'attract';

    if (isRightClick) {
      this.triggerShockwave(x, y);
    } else {
      if (window.CyberAudio) window.CyberAudio.playTap(1400);
    }
  }

  handlePointerMove(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  handlePointerUp() {
    this.pointer.active = false;
  }

  update() {
    const { width, height, gravity, pointer } = this;
    const p = this.particles;
    const len = this.numParticles;
    const theme = this.colorThemes[this.themeIndex];

    // Shockwaves update
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += 8;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.alpha <= 0) {
        this.shockwaves.splice(s, 1);
      }
    }

    const damping = 0.985;
    const px = pointer.x;
    const py = pointer.y;
    const pActive = pointer.active;
    const pMode = pointer.mode;

    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      let x = p[idx];
      let y = p[idx + 1];
      let vx = p[idx + 2];
      let vy = p[idx + 3];

      // Gravity
      vx += gravity.x;
      vy += gravity.y;

      // Pointer force (swirling vortex or blast)
      if (pActive) {
        const dx = px - x;
        const dy = py - y;
        const distSq = dx * dx + dy * dy + 100;
        const dist = Math.sqrt(distSq);

        if (dist < 260) {
          const force = 120 / distSq;
          if (pMode === 'attract') {
            // Inward pull + tangential vortex spin
            vx += dx * force * 1.8 - dy * force * 2.2;
            vy += dy * force * 1.8 + dx * force * 2.2;
          } else {
            // Repel
            vx -= dx * force * 5.0;
            vy -= dy * force * 5.0;
          }
        }
      }

      // Shockwaves force
      for (let s = 0; s < this.shockwaves.length; s++) {
        const sw = this.shockwaves[s];
        const dx = x - sw.x;
        const dy = y - sw.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const diff = Math.abs(dist - sw.radius);
        if (diff < 20) {
          const power = (sw.power * (1 - diff / 20) * sw.alpha) / dist;
          vx += dx * power;
          vy += dy * power;
        }
      }

      // Velocity damping
      vx *= damping;
      vy *= damping;

      // Position update
      x += vx;
      y += vy;

      // Boundary collision with restitution
      const bounce = -0.7;
      if (x < 2) { x = 2; vx *= bounce; }
      else if (x > width - 2) { x = width - 2; vx *= bounce; }
      if (y < 2) { y = 2; vy *= bounce; }
      else if (y > height - 2) { y = height - 2; vy *= bounce; }

      p[idx] = x;
      p[idx + 1] = y;
      p[idx + 2] = vx;
      p[idx + 3] = vy;
    }
  }

  render() {
    const { ctx, width, height } = this;
    const p = this.particles;
    const len = this.numParticles;
    const theme = this.colorThemes[this.themeIndex];

    // Silky fluid motion blur trail
    ctx.fillStyle = 'rgba(7, 10, 19, 0.32)';
    ctx.fillRect(0, 0, width, height);

    // Render shockwaves
    for (let s = 0; s < this.shockwaves.length; s++) {
      const sw = this.shockwaves[s];
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 245, 255, ${sw.alpha * 0.7})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Pointer ripple
    if (this.pointer.active) {
      ctx.beginPath();
      ctx.arc(this.pointer.x, this.pointer.y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = this.pointer.mode === 'attract' ? 'rgba(0, 245, 255, 0.4)' : 'rgba(255, 0, 128, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Render particles using fast path
    // We group particles by speed tier to minimize fillStyle switches
    ctx.save();
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      const x = p[idx];
      const y = p[idx + 1];
      const vx = p[idx + 2];
      const vy = p[idx + 3];
      const speed = vx * vx + vy * vy;

      let r, g, b;
      if (speed < 4) {
        [r, g, b] = theme.low;
      } else if (speed < 20) {
        [r, g, b] = theme.mid;
      } else {
        [r, g, b] = theme.high;
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
    }
    ctx.restore();
  }
}

window.QuantumFluidApp = QuantumFluidApp;
