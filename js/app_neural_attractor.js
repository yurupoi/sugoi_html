/**
 * App 2: Neural Attractor & Chaos Nebula
 * Real-time mathematical strange attractor with interactive parameter morphing.
 */
class NeuralAttractorApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.presets = [
      { name: 'Cyber Butterfly', a: -1.4, b: 1.6, c: 1.0, d: 0.7, hueBase: 190 },
      { name: 'Quantum Singularity', a: 1.7, b: 1.7, c: 0.6, d: 1.2, hueBase: 280 },
      { name: 'Plasma Rose', a: -1.7, b: 1.3, c: -0.1, d: -1.2, hueBase: 330 },
      { name: 'Neural Lattice', a: -1.3, b: -1.3, c: -1.8, d: -1.9, hueBase: 160 }
    ];
    this.presetIndex = 0;

    // Current parameters & targets for smooth morphing
    const p = this.presets[0];
    this.params = { a: p.a, b: p.b, c: p.c, d: p.d };
    this.targetParams = { a: p.a, b: p.b, c: p.c, d: p.d };
    this.hue = p.hueBase;
    this.targetHue = p.hueBase;

    this.numParticles = 2800;
    this.particles = [];
    this.initParticles();

    this.pointer = { x: 0, y: 0, active: false };
    this.time = 0;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        vx: 0,
        vy: 0,
        age: Math.floor(Math.random() * 200)
      });
    }
  }

  cyclePreset() {
    this.presetIndex = (this.presetIndex + 1) % this.presets.length;
    const p = this.presets[this.presetIndex];
    this.targetParams.a = p.a;
    this.targetParams.b = p.b;
    this.targetParams.c = p.c;
    this.targetParams.d = p.d;
    this.targetHue = p.hueBase;
    if (window.CyberAudio) window.CyberAudio.playWarp();
    return p.name;
  }

  handlePointerDown(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = true;
    this.warpWithPointer(x, y);
    if (window.CyberAudio) window.CyberAudio.playTap(1600);
  }

  handlePointerMove(x, y) {
    if (this.pointer.active) {
      this.pointer.x = x;
      this.pointer.y = y;
      this.warpWithPointer(x, y);
    }
  }

  handlePointerUp() {
    this.pointer.active = false;
  }

  warpWithPointer(x, y) {
    const nx = (x / this.width - 0.5) * 2;
    const ny = (y / this.height - 0.5) * 2;
    const cur = this.presets[this.presetIndex];
    this.targetParams.a = cur.a + nx * 0.8;
    this.targetParams.b = cur.b + ny * 0.8;
  }

  update() {
    this.time += 0.015;

    // Smooth parameter interpolation
    const ease = 0.05;
    this.params.a += (this.targetParams.a - this.params.a) * ease;
    this.params.b += (this.targetParams.b - this.params.b) * ease;
    this.params.c += (this.targetParams.c - this.params.c) * ease;
    this.params.d += (this.targetParams.d - this.params.d) * ease;
    this.hue += (this.targetHue - this.hue) * ease;

    const { a, b, c, d } = this.params;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Clifford Attractor formula with continuous flow
      const nx = Math.sin(a * p.y) + c * Math.cos(a * p.x);
      const ny = Math.sin(b * p.x) + d * Math.cos(b * p.y);

      p.vx = (nx - p.x) * 0.16;
      p.vy = (ny - p.y) * 0.16;

      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      if (p.age > 260 || isNaN(p.x) || Math.abs(p.x) > 6 || Math.abs(p.y) > 6) {
        p.x = (Math.random() - 0.5) * 3;
        p.y = (Math.random() - 0.5) * 3;
        p.vx = 0;
        p.vy = 0;
        p.age = 0;
      }
    }
  }

  render() {
    const { ctx, width, height } = this;
    const halfW = width / 2;
    const halfH = height / 2 + 10;
    const scale = Math.min(width, height) * 0.32;

    // Atmospheric dark fade
    ctx.fillStyle = 'rgba(6, 8, 16, 0.18)';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const baseHue = this.hue + Math.sin(this.time * 0.5) * 25;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const screenX = halfW + p.x * scale;
      const screenY = halfH + p.y * scale;

      const pSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const pAlpha = Math.min(0.9, 0.2 + pSpeed * 2.8);
      const pHue = (baseHue + pSpeed * 140 + (i % 80)) % 360;

      ctx.fillStyle = `hsla(${pHue}, 95%, 65%, ${pAlpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 1.6 + pSpeed * 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Central HUD ring and coordinates
    ctx.save();
    ctx.strokeStyle = `hsla(${this.hue}, 80%, 55%, 0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(halfW, halfH, scale * 1.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(`PHASE PARAMETERS: a=${this.params.a.toFixed(2)} b=${this.params.b.toFixed(2)} c=${this.params.c.toFixed(2)} d=${this.params.d.toFixed(2)}`, 24, height - 120);
    ctx.fillText(`TOUCH & DRAG TO WARP SPACETIME`, 24, height - 98);
    ctx.restore();
  }
}

window.NeuralAttractorApp = NeuralAttractorApp;
