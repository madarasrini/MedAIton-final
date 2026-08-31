// Sound and Audio Snooze Service for MediFlow AI Hospital System

export interface SoundState {
  isMuted: boolean;
  snoozeUntil: number | null; // Timestamp in milliseconds
  snoozeRemainingSeconds: number;
  isSnoozed: boolean;
  isSoundAllowed: boolean;
}

const STORAGE_KEY_MUTED = 'mediflow_sound_muted';
const STORAGE_KEY_SNOOZE_UNTIL = 'mediflow_snooze_until';

class SoundService {
  private isMutedState: boolean = false;
  private snoozeUntilTimestamp: number | null = null;
  private listeners: Set<(state: SoundState) => void> = new Set();
  private timer: number | null = null;

  constructor() {
    this.loadInitialState();
    this.startTicker();
  }

  private loadInitialState() {
    if (typeof window !== 'undefined') {
      try {
        const storedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
        if (storedMuted !== null) {
          this.isMutedState = storedMuted === 'true';
        }

        const storedSnooze = localStorage.getItem(STORAGE_KEY_SNOOZE_UNTIL);
        if (storedSnooze) {
          const timestamp = parseInt(storedSnooze, 10);
          if (!isNaN(timestamp) && timestamp > Date.now()) {
            this.snoozeUntilTimestamp = timestamp;
          } else {
            localStorage.removeItem(STORAGE_KEY_SNOOZE_UNTIL);
          }
        }
      } catch (e) {
        console.warn('SoundService: localStorage not accessible', e);
      }
    }
  }

  private startTicker() {
    if (typeof window !== 'undefined') {
      this.timer = window.setInterval(() => {
        if (this.snoozeUntilTimestamp !== null) {
          if (Date.now() >= this.snoozeUntilTimestamp) {
            this.snoozeUntilTimestamp = null;
            try {
              localStorage.removeItem(STORAGE_KEY_SNOOZE_UNTIL);
            } catch (e) {}
            this.notify();
          } else {
            // Keep ticking so UI countdowns update
            this.notify();
          }
        }
      }, 1000);
    }
  }

  public getState(): SoundState {
    const now = Date.now();
    const isSnoozed = this.snoozeUntilTimestamp !== null && this.snoozeUntilTimestamp > now;
    const snoozeRemainingSeconds = isSnoozed && this.snoozeUntilTimestamp 
      ? Math.max(0, Math.ceil((this.snoozeUntilTimestamp - now) / 1000))
      : 0;

    return {
      isMuted: this.isMutedState,
      snoozeUntil: this.snoozeUntilTimestamp,
      snoozeRemainingSeconds,
      isSnoozed,
      isSoundAllowed: !this.isMutedState && !isSnoozed,
    };
  }

  public isSoundAllowed(): boolean {
    return this.getState().isSoundAllowed;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public isSnoozed(): boolean {
    return this.getState().isSnoozed;
  }

  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    if (this.isMutedState) {
      this.cancelSpeech();
    }
    this.saveState();
    this.notify();
    return this.isMutedState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    if (this.isMutedState) {
      this.cancelSpeech();
    }
    this.saveState();
    this.notify();
  }

  public snooze(minutes: number): void {
    const durationMs = minutes * 60 * 1000;
    this.snoozeUntilTimestamp = Date.now() + durationMs;
    this.cancelSpeech();
    this.saveState();
    this.notify();
  }

  public cancelSnooze(): void {
    this.snoozeUntilTimestamp = null;
    this.isMutedState = false; // Restore sound directly
    try {
      localStorage.removeItem(STORAGE_KEY_SNOOZE_UNTIL);
      localStorage.setItem(STORAGE_KEY_MUTED, 'false');
    } catch (e) {}
    this.notify();
  }

  public cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_MUTED, String(this.isMutedState));
        if (this.snoozeUntilTimestamp) {
          localStorage.setItem(STORAGE_KEY_SNOOZE_UNTIL, String(this.snoozeUntilTimestamp));
        } else {
          localStorage.removeItem(STORAGE_KEY_SNOOZE_UNTIL);
        }
      } catch (e) {}
    }
  }

  public subscribe(listener: (state: SoundState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  // Audio tone generation for previews / confirmations
  public playTestChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Two-tone bright medical hospital chime
      playTone(659.25, 0, 0.18); // E5
      playTone(880.00, 0.12, 0.35); // A5
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }
}

export const soundService = new SoundService();
