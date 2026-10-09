// Synthesizes pleasant acoustic totem sounds using Web Audio API (no external audio files needed)

class SoundManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialized lazily on first user interaction
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private getAudioContext(): AudioContext | null {
    if (!this.isEnabled) return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Soft kiosk tap feedback
  public playTap() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext fails gracefully
    }
  }

  // Happy chime when item is added to cart
  public playItemAdded() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.15);
      });
    } catch {
      // AudioContext fails gracefully
    }
  }

  // Success fanfare when order is confirmed and ticket is generated
  public playSuccess() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const melody = [
        { freq: 440, duration: 0.1, delay: 0 },
        { freq: 554.37, duration: 0.1, delay: 0.1 },
        { freq: 659.25, duration: 0.1, delay: 0.2 },
        { freq: 880, duration: 0.35, delay: 0.3 },
      ];

      melody.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.freq, now + item.delay);

        gain.gain.setValueAtTime(0.15, now + item.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.delay + item.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + item.delay);
        osc.stop(now + item.delay + item.duration);
      });
    } catch {
      // AudioContext fails gracefully
    }
  }

  // Soft click for quantity increment/decrement
  public playTick() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // AudioContext fails gracefully
    }
  }
}

export const soundService = new SoundManager();
