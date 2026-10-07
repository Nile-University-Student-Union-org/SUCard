"use client";

// Web Audio API and Vibration feedback for Cashier Scanner

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isScannerMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("sucard_scanner_muted") === "true";
  } catch {
    return false;
  }
}

export function setScannerMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sucard_scanner_muted", muted ? "true" : "false");
  } catch {
    // Ignore storage errors
  }
}

/**
 * Play a pleasant two-tone chime on successful validation/confirmation
 */
export function playSuccessSound(): void {
  if (isScannerMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // First note: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second note: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch {
    // Graceful fallback if Web Audio is blocked
  }
}

/**
 * Play a low alert buzz on invalid scans
 */
export function playErrorSound(): void {
  if (isScannerMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Buzz 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(160, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Buzz 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(140, now + 0.18);
    gain2.gain.setValueAtTime(0.2, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.35);
  } catch {
    // Graceful fallback
  }
}

/**
 * Trigger vibration pattern if supported
 */
export function triggerVibrate(pattern: "success" | "error"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    if (pattern === "success") {
      navigator.vibrate([50, 50, 100]);
    } else {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Ignore vibration failure
  }
}

export function notifySuccess(): void {
  playSuccessSound();
  triggerVibrate("success");
}

export function notifyError(): void {
  playErrorSound();
  triggerVibrate("error");
}
