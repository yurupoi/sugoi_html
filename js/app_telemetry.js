/**
 * App 4: Core Telemetry & Biometric HUD
 * Live diagnostics, rotating radar scanner, real-time ECG pulse & interactive biometric scan.
 */
class TelemetryApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Scanning state
    this.isScanning = false;
    this.scanProgress = 0; // 0.0 to 1.0
    this.scanComplete = false;
    this.scanPulse = 0;
    this.scanLaserY = 0;
    this.particles = [];

    // Telemetry graphs
    this.fps = 60;
    this.fpsHistory = new Float32Array(30).fill(60);
    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    // ECG wave
    this.ecgHistory = new Float32Array(60).fill(0);
    this.ecgPhase = 0;

    // Radar
    this.radarAngle = 0;
    this.radarBlips = [
      { r: 0.35, angle: 0.8, life: 1.0 },
      { r: 0.65, angle: 2.3, life: 1.0 },
      { r: 0.85, angle: 4.7, life: 1.0 }
    ];
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  handlePointerDown(x, y) {
    // Check if clicked in Biometric Scan button area (comfortable middle-lower placement)
    const btnTop = 640;
    const btnH = 140;
    if (y >= btnTop && y <= btnTop + btnH && x >= 24 && x <= this.width - 24) {
      this.startScan();
    } else {
      if (window.CyberAudio) window.CyberAudio.playTap(1200);
    }
  }

  handlePointerUp() {
    if (this.isScanning && !this.scanComplete) {
      this.cancelScan();
    }
  }

  startScan() {
    this.isScanning = true;
    this.scanComplete = false;
    this.scanProgress = 0;
    if (window.CyberAudio) {
      window.CyberAudio.init();
      window.CyberAudio.playWarp(false);
    }
  }

  cancelScan() {
    this.isScanning = false;
    this.scanProgress = 0;
    if (window.CyberAudio) window.CyberAudio.playTap(400);
  }

  update() {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (dt > 0) {
      const curFps = Math.min(120, Math.round(1000 / dt));
      this.fps = this.fps * 0.9 + curFps * 0.1;
    }

    this.frameCount++;
    if (this.frameCount % 4 === 0) {
      for (let i = 0; i < this.fpsHistory.length - 1; i++) {
        this.fpsHistory[i] = this.fpsHistory[i + 1];
      }
      this.fpsHistory[this.fpsHistory.length - 1] = this.fps;
    }

    // Radar rotation
    this.radarAngle += 0.035;

    // ECG pulse generation
    this.ecgPhase += 0.08;
    for (let i = 0; i < this.ecgHistory.length - 1; i++) {
      this.ecgHistory[i] = this.ecgHistory[i + 1];
    }
    const beat = this.ecgPhase % (Math.PI * 2);
    let ecgVal = 0;
    if (beat > 1.2 && beat < 1.4) ecgVal = -0.3;
    else if (beat >= 1.4 && beat < 1.7) ecgVal = 1.0;
    else if (beat >= 1.7 && beat < 1.9) ecgVal = -0.5;
    else if (beat > 2.2 && beat < 2.6) ecgVal = 0.25;
    this.ecgHistory[this.ecgHistory.length - 1] = ecgVal;

    // Scan progress
    if (this.isScanning && !this.scanComplete) {
      this.scanProgress += 0.015;
      this.scanLaserY = 100 + (this.height - 380) * Math.sin(this.scanProgress * Math.PI * 3);

      if (Math.random() < 0.3 && window.CyberAudio) {
        window.CyberAudio.playTap(600 + this.scanProgress * 1200);
      }

      if (this.scanProgress >= 1.0) {
        this.scanProgress = 1.0;
        this.scanComplete = true;
        this.isScanning = false;
        if (window.CyberAudio) window.CyberAudio.playScanSuccess();
        // Spawn success particles
        for (let i = 0; i < 60; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 6;
          this.particles.push({
            x: this.width / 2,
            y: 710,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1.0
          });
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const { ctx, width, height } = this;

    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Section 1: System Telemetry Cards
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.fillRect(16, 70, width - 32, 110);
    ctx.strokeRect(16, 70, width - 32, 110);

    // FPS & CPU text
    ctx.fillStyle = '#00f5ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`NEURAL CORE : ACTIVE [${Math.round(this.fps)} FPS]`, 26, 96);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`MEMORY ALLOC: 12.4 GB / 16.0 GB (QUANTUM-DDR6)`, 26, 122);
    ctx.fillText(`NEURAL SYNAPSE LOAD: ${(45 + Math.sin(Date.now() * 0.002) * 12).toFixed(1)}%`, 26, 146);

    // Mini FPS Graph
    const graphX = width - 110;
    const graphY = 85;
    ctx.strokeStyle = '#00f5ff';
    ctx.beginPath();
    for (let i = 0; i < this.fpsHistory.length; i++) {
      const gx = graphX + i * 2.8;
      const gy = graphY + 40 - (this.fpsHistory[i] / 80) * 35;
      if (i === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    }
    ctx.stroke();

    // Section 2: Circular Radar Scanner
    const radarCenterX = width / 2;
    const radarCenterY = 295;
    const radarRadius = 85;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.35)';
    ctx.lineWidth = 1;

    // Rings
    [0.35, 0.7, 1.0].forEach(r => {
      ctx.beginPath();
      ctx.arc(radarCenterX, radarCenterY, radarRadius * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(radarCenterX - radarRadius, radarCenterY);
    ctx.lineTo(radarCenterX + radarRadius, radarCenterY);
    ctx.moveTo(radarCenterX, radarCenterY - radarRadius);
    ctx.lineTo(radarCenterX, radarCenterY + radarRadius);
    ctx.stroke();

    // Radar Sweep Beam
    ctx.beginPath();
    ctx.moveTo(radarCenterX, radarCenterY);
    ctx.arc(radarCenterX, radarCenterY, radarRadius, this.radarAngle, this.radarAngle + 0.55);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 245, 255, 0.18)';
    ctx.fill();

    // Radar Blips
    this.radarBlips.forEach(b => {
      const bx = radarCenterX + Math.cos(b.angle) * radarRadius * b.r;
      const by = radarCenterY + Math.sin(b.angle) * radarRadius * b.r;
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore();

    // Section 3: Real-Time ECG Heartbeat Wave
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('BIOMETRIC PULSE (74 BPM)', 26, 420);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const ecgW = width - 52;
    const ecgStep = ecgW / (this.ecgHistory.length - 1);
    for (let i = 0; i < this.ecgHistory.length; i++) {
      const ex = 26 + i * ecgStep;
      const ey = 465 - this.ecgHistory[i] * 28;
      if (i === 0) ctx.moveTo(ex, ey);
      else ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Laser Scan Beam when active
    if (this.isScanning) {
      ctx.strokeStyle = 'rgba(255, 0, 128, 0.9)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(20, this.scanLaserY);
      ctx.lineTo(width - 20, this.scanLaserY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Section 4: Biometric Scanner Button
    const btnTop = 540;
    const btnH = 180;
    const btnW = width - 48;

    ctx.save();
    if (this.scanComplete) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.strokeStyle = '#22c55e';
    } else if (this.isScanning) {
      ctx.fillStyle = 'rgba(255, 0, 128, 0.25)';
      ctx.strokeStyle = '#ff007f';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
    }

    ctx.lineWidth = 2;
    ctx.fillRect(24, btnTop, btnW, btnH);
    ctx.strokeRect(24, btnTop, btnW, btnH);

    // Fingerprint / Core Icon
    const iconX = width / 2;
    const iconY = btnTop + 65;
    ctx.beginPath();
    ctx.arc(iconX, iconY, 32, 0, Math.PI * 2);
    ctx.strokeStyle = this.scanComplete ? '#22c55e' : (this.isScanning ? '#ff007f' : '#00f5ff');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner concentric ring
    ctx.beginPath();
    ctx.arc(iconX, iconY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = this.scanComplete ? '#22c55e' : (this.isScanning ? '#ff007f' : '#00f5ff');
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    if (this.scanComplete) {
      ctx.fillStyle = '#22c55e';
      ctx.fillText('NEURAL SYNC VERIFIED [100%]', iconX, btnTop + 145);
    } else if (this.isScanning) {
      ctx.fillStyle = '#ff007f';
      ctx.fillText(`SCANNING... ${Math.round(this.scanProgress * 100)}%`, iconX, btnTop + 145);
    } else {
      ctx.fillStyle = '#00f5ff';
      ctx.fillText('TOUCH / CLICK TO SYNC', iconX, btnTop + 145);
    }
    ctx.textAlign = 'left';
    ctx.restore();

    // Render particles
    for (let p of this.particles) {
      ctx.fillStyle = `rgba(34, 197, 94, ${p.life})`;
      ctx.fillRect(p.x - 2, p.y - 2, 5, 5);
    }
  }
}

window.TelemetryApp = TelemetryApp;
