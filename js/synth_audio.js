/**
 * NEXUS Cyber-SP: Procedural Sound Engine
 * 100% Web Audio API - Zero External Dependencies
 */
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;
    this.bgmTimer = null;
    this.bgmPlaying = false;
    this.tempo = 124;
    this.scale = [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63]; // C minor pentatonic / Aeolian
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      const targetGain = this.isMuted ? 0 : 0.35;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
    }
    return !this.isMuted;
  }

  // --- UI Sound Effects ---

  // High-tech tactile click
  playTap(pitch = 1200) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(pitch * 1.5, this.ctx.currentTime);
      filter.Q.value = 4.0;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.25, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Hologram power-up / warp swipe
  playWarp(reverse = false) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      if (!reverse) {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      } else {
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      }

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  // Success / Scan Complete chime
  playScanSuccess() {
    if (this.isMuted || !this.ctx) return;
    try {
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.36);
      });
    } catch (e) {}
  }

  // Synth musical note (for synth keyboard & beat pad)
  playSynthNote(freq, type = 'sawtooth', duration = 0.3) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + duration);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  // Drum sound generation (Kick, Snare, HiHat, CyberLaser)
  playDrum(type) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      if (type === 'kick') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'snare') {
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        whiteNoise.start(now);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'hihat') {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
      } else if (type === 'zap') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.13);
      }
    } catch (e) {}
  }

  // Background Synthwave Procedural Groove
  toggleBgm() {
    this.init();
    if (this.bgmPlaying) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
      this.bgmPlaying = false;
      return false;
    }

    this.bgmPlaying = true;
    const stepDuration = (60 / this.tempo) / 4; // 16th notes
    let step = 0;

    const bassline = [65.41, 0, 65.41, 0, 77.78, 0, 87.31, 65.41, 58.27, 0, 58.27, 0, 77.78, 0, 87.31, 0];
    const arpNotes = [261.63, 311.13, 392.00, 466.16, 523.25, 466.16, 392.00, 311.13];

    this.bgmTimer = setInterval(() => {
      if (this.isMuted) return;

      const currentStep = step % 16;

      if (currentStep % 4 === 0) {
        this.playDrum('kick');
      }
      if (currentStep === 4 || currentStep === 12) {
        this.playDrum('snare');
      }
      if (currentStep % 2 === 1) {
        this.playDrum('hihat');
      }

      const bassFreq = bassline[currentStep];
      if (bassFreq > 0) {
        this.playSynthNote(bassFreq, 'triangle', stepDuration * 1.5);
      }

      if (currentStep % 2 === 0) {
        const note = arpNotes[Math.floor(step / 2) % arpNotes.length];
        this.playSynthNote(note, 'sine', stepDuration * 2);
      }

      step++;
    }, stepDuration * 1000);

    return true;
  }
}

window.CyberAudio = new CyberAudioEngine();
