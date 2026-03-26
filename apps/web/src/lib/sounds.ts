"use client";

export type SoundName =
  | "questComplete"
  | "levelUp"
  | "chestOpen"
  | "achievementUnlock"
  | "loginBonus"
  | "leagueResult"
  | "error";

const SOUND_PREF_KEY = "halaqat-sounds";

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private hasUserInteracted = false;
  private listenersAttached = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.enabled = this.isEnabled();
      this.attachInteractionListeners();
    }
  }

  private attachInteractionListeners() {
    if (this.listenersAttached || typeof window === "undefined") return;
    this.listenersAttached = true;

    const unlock = () => {
      this.hasUserInteracted = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    if (typeof window === "undefined") return;
    this.enabled = enabled;
    localStorage.setItem(SOUND_PREF_KEY, enabled ? "on" : "off");
  }

  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored !== "off";
  }

  private canPlay(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.enabled || !this.isEnabled()) return false;
    if (!this.hasUserInteracted) return false;
    return true;
  }

  async play(name: SoundName) {
    if (!this.canPlay()) return;

    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (name) {
      case "questComplete":
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;

      case "levelUp":
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.6);
        break;

      case "chestOpen":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case "achievementUnlock":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(659, ctx.currentTime);
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.7);
        break;

      case "loginBonus":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(987, ctx.currentTime);
        oscillator.frequency.setValueAtTime(1318, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
        break;

      case "leagueResult":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.35); // C6
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
        break;

      case "error":
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
    }
  }
}

export const soundManager = new SoundManager();
