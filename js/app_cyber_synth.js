/**
 * App 3: Cyber Synth & Beat Matrix
 * Interactive 16-step drum sequencer + touch synth ribbon + real-time oscilloscope visualizer.
 */
class CyberSynthApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.isPlaying = false;
    this.currentStep = 0;
    this.bpm = 124;
    this.timer = null;

    // 4 Tracks x 16 Steps
    this.tracks = [
      { name: 'KICK', type: 'kick', color: '#00f5ff', steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] },
      { name: 'SNARE', type: 'snare', color: '#ff007f', steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'HI-HAT', type: 'hihat', color: '#eab308', steps: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1] },
      { name: 'CYBER', type: 'zap', color: '#a855f7', steps: [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,1,0] }
    ];

    // Synth Keyboard (8 notes in C minor)
    this.synthNotes = [
      { note: 'C4', freq: 261.63, active: false },
      { note: 'D4', freq: 293.66, active: false },
      { note: 'Eb4', freq: 311.13, active: false },
      { note: 'F4', freq: 349.23, active: false },
      { note: 'G4', freq: 392.00, active: false },
      { note: 'Ab4', freq: 415.30, active: false },
      { note: 'Bb4', freq: 466.16, active: false },
      { note: 'C5', freq: 523.25, active: false }
    ];
    this.waveType = 'sawtooth';

    // Visualizer wave history
    this.waveHistory = new Float32Array(80);
    this.activeRipples = [];
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (window.CyberAudio) window.CyberAudio.init();
      const intervalMs = (60 / this.bpm / 4) * 1000;
      this.timer = setInterval(() => this.step(), intervalMs);
      if (window.CyberAudio) window.CyberAudio.playTap(1800);
    } else {
      clearInterval(this.timer);
      this.timer = null;
      if (window.CyberAudio) window.CyberAudio.playTap(900);
    }
    return this.isPlaying;
  }

  step() {
    this.currentStep = (this.currentStep + 1) % 16;

    if (window.CyberAudio) {
      for (let t = 0; t < this.tracks.length; t++) {
        if (this.tracks[t].steps[this.currentStep]) {
          window.CyberAudio.playDrum(this.tracks[t].type);
          this.triggerWaveSurge(0.8);
        }
      }
    }
  }

  triggerWaveSurge(amt = 0.5) {
    for (let i = 0; i < this.waveHistory.length; i++) {
      this.waveHistory[i] += (Math.random() - 0.5) * amt;
    }
  }

  toggleWaveType() {
    const types = ['sawtooth', 'triangle', 'square'];
    const idx = (types.indexOf(this.waveType) + 1) % types.length;
    this.waveType = types[idx];
    if (window.CyberAudio) window.CyberAudio.playTap(1400);
    return this.waveType;
  }

  handlePointerDown(x, y) {
    // 1. Check Sequencer Grid
    const gridTop = 90;
    const gridHeight = 220;
    const trackH = gridHeight / 4;
    const colW = (this.width - 64) / 16;

    if (x >= 54 && x <= this.width - 10 && y >= gridTop && y <= gridTop + gridHeight) {
      const trackIdx = Math.floor((y - gridTop) / trackH);
      const stepIdx = Math.floor((x - 54) / colW);

      if (trackIdx >= 0 && trackIdx < 4 && stepIdx >= 0 && stepIdx < 16) {
        const tr = this.tracks[trackIdx];
        tr.steps[stepIdx] = tr.steps[stepIdx] ? 0 : 1;
        if (tr.steps[stepIdx] && window.CyberAudio) {
          window.CyberAudio.playDrum(tr.type);
        }
        return;
      }
    }

    // 2. Check Synth Keys (Positioned comfortably in middle-lower section)
    const keyTop = 620;
    const keyHeight = 180;
    const keyWidth = (this.width - 24) / 8;

    if (y >= keyTop && y <= keyTop + keyHeight && x >= 12 && x <= this.width - 12) {
      const keyIdx = Math.floor((x - 12) / keyWidth);
      if (keyIdx >= 0 && keyIdx < 8) {
        const item = this.synthNotes[keyIdx];
        item.active = true;
        if (window.CyberAudio) {
          window.CyberAudio.playSynthNote(item.freq, this.waveType, 0.45);
        }
        this.triggerWaveSurge(1.0);
        this.activeRipples.push({
          x: 12 + keyIdx * keyWidth + keyWidth / 2,
          y: keyTop + keyHeight / 2,
          r: 5,
          alpha: 1.0
        });
      }
    }
  }

  handlePointerUp() {
    for (let k of this.synthNotes) {
      k.active = false;
    }
  }

  update() {
    // Decay visualizer waves
    for (let i = 0; i < this.waveHistory.length; i++) {
      this.waveHistory[i] *= 0.92;
      this.waveHistory[i] += Math.sin(Date.now() * 0.005 + i * 0.2) * 0.04;
    }

    // Update ripples
    for (let i = this.activeRipples.length - 1; i >= 0; i--) {
      const rip = this.activeRipples[i];
      rip.r += 4;
      rip.alpha -= 0.04;
      if (rip.alpha <= 0) {
        this.activeRipples.splice(i, 1);
      }
    }
  }

  render() {
    const { ctx, width, height } = this;

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    // Header Info
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`BEAT MATRIX 16-STEP [${this.bpm} BPM]`, 20, 75);

    // Render 16-Step Sequencer Grid
    const gridTop = 90;
    const gridHeight = 220;
    const trackH = gridHeight / 4;
    const colW = (width - 64) / 16;

    for (let t = 0; t < 4; t++) {
      const tr = this.tracks[t];

      // Track Label
      ctx.fillStyle = tr.color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(tr.name, 12, gridTop + t * trackH + trackH * 0.65);

      for (let s = 0; s < 16; s++) {
        const x = 54 + s * colW;
        const y = gridTop + t * trackH + 3;
        const isCurrent = s === this.currentStep && this.isPlaying;
        const isActive = tr.steps[s] === 1;

        if (isActive) {
          ctx.fillStyle = tr.color;
          ctx.shadowColor = tr.color;
          ctx.shadowBlur = isCurrent ? 14 : 6;
          ctx.fillRect(x + 1, y, colW - 3, trackH - 6);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = isCurrent ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)';
          ctx.fillRect(x + 1, y, colW - 3, trackH - 6);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(x + 1, y, colW - 3, trackH - 6);
      }
    }

    // Playhead glowing laser bar
    if (this.isPlaying) {
      const playX = 54 + this.currentStep * colW + colW / 2;
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(playX, gridTop);
      ctx.lineTo(playX, gridTop + gridHeight);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Middle Oscilloscope Display Box
    const oscBoxTop = 345;
    const oscBoxHeight = 210;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
    ctx.fillRect(16, oscBoxTop, width - 32, oscBoxHeight);
    ctx.strokeRect(16, oscBoxTop, width - 32, oscBoxHeight);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('LIVE OSCILLOSCOPE SPECTRUM', 26, oscBoxTop + 22);

    // Oscilloscope Waves
    const midY = oscBoxTop + oscBoxHeight / 2 + 10;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(20, midY);
    const stepX = (width - 40) / (this.waveHistory.length - 1);
    for (let i = 0; i < this.waveHistory.length; i++) {
      const y = midY + this.waveHistory[i] * 65;
      ctx.lineTo(20 + i * stepX, y);
    }
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Mirror wave
    ctx.beginPath();
    ctx.moveTo(20, midY);
    for (let i = 0; i < this.waveHistory.length; i++) {
      const y = midY - this.waveHistory[i] * 65;
      ctx.lineTo(20 + i * stepX, y);
    }
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();

    // Render Synth Keyboard Section
    const keyTop = 600;
    const keyHeight = 210;
    const keyWidth = (width - 24) / 8;

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`SYNTH KEYBOARD [${this.waveType.toUpperCase()}]`, 20, keyTop - 14);

    for (let i = 0; i < 8; i++) {
      const item = this.synthNotes[i];
      const x = 12 + i * keyWidth;
      const y = keyTop;

      if (item.active) {
        ctx.fillStyle = 'rgba(0, 245, 255, 0.5)';
        ctx.strokeStyle = '#00f5ff';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 18;
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.35)';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x + 2, y, keyWidth - 4, keyHeight);
      ctx.strokeRect(x + 2, y, keyWidth - 4, keyHeight);

      // Key Note Text
      ctx.fillStyle = item.active ? '#fff' : '#00f5ff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.note, x + keyWidth / 2, y + keyHeight - 24);
      ctx.textAlign = 'left';
    }

    // Render Key Tap Ripples
    for (let rip of this.activeRipples) {
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 245, 255, ${rip.alpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
}

window.CyberSynthApp = CyberSynthApp;
