/**
 * NEXUS Cyber-SP: Master Orchestrator
 * Seamless integration between 3D Spatial Hologram & Direct SP Mode
 */
class NexusSPApp {
  constructor() {
    this.screenCanvas = document.getElementById('phoneScreenCanvas');
    this.screenCanvas.width = 480;
    this.screenCanvas.height = 1040;
    this.screenCtx = this.screenCanvas.getContext('2d');

    // Viewport Mode: '3D' or 'SP'
    this.viewMode = '3D';

    // Subsystems
    this.audio = window.CyberAudio;
    this.device3D = null;
    this.activeAppIndex = 0; // 0: Fluid, 1: Attractor, 2: Synth, 3: Telemetry

    // Apps
    this.apps = [];

    // UI Elements
    this.activeAppTitle = document.getElementById('activeAppTitle');
    this.actionBtn = document.getElementById('appActionBtn');

    this.init();
  }

  init() {
    // 1. Initialize Apps
    this.apps = [
      new window.QuantumFluidApp(this.screenCanvas),
      new window.NeuralAttractorApp(this.screenCanvas),
      new window.CyberSynthApp(this.screenCanvas),
      new window.TelemetryApp(this.screenCanvas)
    ];

    // 2. Initialize 3D Studio
    const container3D = document.getElementById('viewport3D');
    this.device3D = new window.Device3DStudio(container3D, this.screenCanvas, (type, x, y, isRight) => {
      this.handleAppInput(type, x, y, isRight);
    });

    // 3. Bind UI & Mode Switches
    this.bindDOMEvents();

    // 4. Gyroscope / DeviceOrientation for real mobile phones
    this.bindOrientation();

    // 5. Start Render Loop
    this.animate();

    // Update initial action button text
    this.updateActionButtonText();
  }

  bindDOMEvents() {
    // Mode Switcher (3D vs Direct SP)
    const btnToggleMode = document.getElementById('btnToggleMode');
    btnToggleMode.addEventListener('click', () => this.toggleViewMode());

    // Sound Toggle
    const btnSound = document.getElementById('btnSound');
    btnSound.addEventListener('click', () => {
      const isUnmuted = this.audio.toggleMute();
      btnSound.textContent = isUnmuted ? '🔊 音声 ON' : '🔇 音声 OFF';
      btnSound.classList.toggle('active', isUnmuted);
      if (isUnmuted) this.audio.playTap(1400);
    });

    // BGM Groove Toggle
    const btnBgm = document.getElementById('btnBgm');
    btnBgm.addEventListener('click', () => {
      const playing = this.audio.toggleBgm();
      btnBgm.textContent = playing ? '🎵 BGM 演奏中' : '🎵 BGM OFF';
      btnBgm.classList.toggle('active', playing);
      if (playing && this.audio.isMuted) {
        this.audio.toggleMute();
        btnSound.textContent = '🔊 音声 ON';
        btnSound.classList.add('active');
      }
    });

    // 3D Auto-Rotate Toggle
    const btnRotate = document.getElementById('btnRotate');
    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        if (this.device3D) {
          this.device3D.autoRotate = !this.device3D.autoRotate;
          btnRotate.textContent = this.device3D.autoRotate ? '🔄 3D自転 ON' : '⏸ 3D静止';
          btnRotate.classList.toggle('active', this.device3D.autoRotate);
        }
      });
    }

    // App Dock Buttons
    const dockButtons = document.querySelectorAll('.dock-btn');
    dockButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const appIdx = parseInt(btn.dataset.app, 10);
        this.switchApp(appIdx);
      });
    });

    // Context Action Button
    if (this.actionBtn) {
      this.actionBtn.addEventListener('click', () => this.triggerAppAction());
    }

    // Dual Quick-Switch Buttons (Sub-bar arrows)
    const btnPrevApp = document.getElementById('btnPrevApp');
    const btnNextApp = document.getElementById('btnNextApp');
    if (btnPrevApp) {
      btnPrevApp.addEventListener('click', () => {
        const nextIdx = (this.activeAppIndex - 1 + this.apps.length) % this.apps.length;
        this.switchApp(nextIdx);
      });
    }
    if (btnNextApp) {
      btnNextApp.addEventListener('click', () => {
        const nextIdx = (this.activeAppIndex + 1) % this.apps.length;
        this.switchApp(nextIdx);
      });
    }

    // Direct SP Mode Screen Pointer Events (Directly on canvas)
    const canvas = this.screenCanvas;
    canvas.addEventListener('pointerdown', (e) => this.onDirectPointer(e, 'down'));
    canvas.addEventListener('pointermove', (e) => this.onDirectPointer(e, 'move'));
    window.addEventListener('pointerup', (e) => this.onDirectPointer(e, 'up'));
    window.addEventListener('pointercancel', (e) => this.onDirectPointer(e, 'up'));

    // Prevent mobile scrolling / bounce gesture while touching canvas
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Prevent context menu on right-click inside phone screen
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window resize handler to ensure 3D and 2D adjust smoothly
    window.addEventListener('resize', () => {
      if (this.viewMode === '3D' && this.device3D) {
        this.device3D.onResize();
      }
    });
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === '3D' ? 'SP' : '3D';
    const body = document.body;
    const btn = document.getElementById('btnToggleMode');

    if (this.viewMode === 'SP') {
      body.classList.add('sp-mode');
      btn.innerHTML = '📱 2Dモード中 (3D切替)';
      btn.classList.add('active');
    } else {
      body.classList.remove('sp-mode');
      btn.innerHTML = '🌐 3D空間中 (2D切替)';
      btn.classList.remove('active');
      if (this.device3D) {
        setTimeout(() => this.device3D.onResize(), 50);
      }
    }

    if (this.audio) this.audio.playWarp();
  }

  switchApp(idx) {
    if (idx === this.activeAppIndex) return;
    this.activeAppIndex = idx;

    // Update Dock UI active class
    const dockButtons = document.querySelectorAll('.dock-btn');
    dockButtons.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.app, 10) === idx);
    });

    // Update titles and hologram colors
    const titles = [
      'QUANTUM FLUID (量子重力パウダー)',
      'CHAOS NEBULA (ニューラルアトラクタ)',
      'BEAT MATRIX (サイバーシンセ＆ドラム)',
      'CORE TELEMETRY (生体＆システム診断)'
    ];
    const holoColors = [0x00f5ff, 0xa855f7, 0xeab308, 0x22c55e];

    if (this.activeAppTitle) {
      this.activeAppTitle.textContent = titles[idx];
    }
    if (this.device3D) {
      this.device3D.setHoloColor(holoColors[idx]);
    }

    this.updateActionButtonText();

    if (this.audio) this.audio.playWarp(idx < this.activeAppIndex);
  }

  triggerAppAction() {
    const curApp = this.apps[this.activeAppIndex];
    if (this.activeAppIndex === 0) { // Quantum Fluid
      const name = curApp.cycleTheme();
      this.actionBtn.textContent = `🎨 テーマ: ${name}`;
    } else if (this.activeAppIndex === 1) { // Neural Attractor
      const name = curApp.cyclePreset();
      this.actionBtn.textContent = `🌀 プリセット: ${name}`;
    } else if (this.activeAppIndex === 2) { // Cyber Synth
      const isPlaying = curApp.togglePlay();
      this.actionBtn.textContent = isPlaying ? '⏸ 停止' : '▶ 再生';
      this.actionBtn.classList.toggle('active', isPlaying);
    } else if (this.activeAppIndex === 3) { // Telemetry
      curApp.startScan();
    }
  }

  updateActionButtonText() {
    if (!this.actionBtn) return;
    this.actionBtn.classList.remove('active');
    if (this.activeAppIndex === 0) {
      this.actionBtn.textContent = `🎨 テーマ切替`;
    } else if (this.activeAppIndex === 1) {
      this.actionBtn.textContent = `🌀 軌道ワープ`;
    } else if (this.activeAppIndex === 2) {
      const isPlaying = this.apps[2].isPlaying;
      this.actionBtn.textContent = isPlaying ? '⏸ 停止' : '▶ 再生';
      this.actionBtn.classList.toggle('active', isPlaying);
    } else if (this.activeAppIndex === 3) {
      this.actionBtn.textContent = `🧬 生体スキャン`;
    }
  }

  onDirectPointer(e, type) {
    if (this.viewMode !== 'SP') return;
    const rect = this.screenCanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scaleX = this.screenCanvas.width / rect.width;
    const scaleY = this.screenCanvas.height / rect.height;

    const x = Math.max(0, Math.min(this.screenCanvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(this.screenCanvas.height, (e.clientY - rect.top) * scaleY));

    this.handleAppInput(type, x, y, e.button === 2);
  }

  handleAppInput(type, x, y, isRight = false) {
    const app = this.apps[this.activeAppIndex];
    if (!app) return;

    if (type === 'down') {
      if (app.handlePointerDown) app.handlePointerDown(x, y, isRight);
    } else if (type === 'move') {
      if (app.handlePointerMove) app.handlePointerMove(x, y);
    } else if (type === 'up') {
      if (app.handlePointerUp) app.handlePointerUp();
    }
  }

  bindOrientation() {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        const gx = Math.max(-1, Math.min(1, e.gamma / 45)) * 0.8;
        const gy = Math.max(-1, Math.min(1, (e.beta - 30) / 45)) * 0.8;

        if (this.apps[0] && this.apps[0].setGravity) {
          this.apps[0].setGravity(gx, gy);
        }
      }
    });
  }

  renderOLEDStatusBar(ctx) {
    const w = this.screenCanvas.width;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 13, 0.85)';
    ctx.fillRect(0, 0, w, 44);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.fillText('NEXUS-6G ⚡', 20, 28);

    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${h}:${m}:${s}`, w / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('100% 🔋', w - 20, 28);

    // Subtle bottom border line
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(w, 44);
    ctx.stroke();

    ctx.restore();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Update & Render Active App
    const activeApp = this.apps[this.activeAppIndex];
    if (activeApp) {
      activeApp.update();
      activeApp.render();
      // Draw OLED status bar on top of the phone screen texture
      this.renderOLEDStatusBar(this.screenCtx);
    }

    // 2. Render 3D Device Studio if in 3D Mode
    if (this.viewMode === '3D' && this.device3D) {
      this.device3D.render();
    }
  }
}

// Launch on page load
window.addEventListener('DOMContentLoaded', () => {
  window.nexus = new NexusSPApp();
});
