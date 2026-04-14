// Global Audio Manager for persistent background sounds
import croudSfx from '../audio/croud.mp3';
import joinCallSfx from '../audio/join_call.mp3';
import endCallSfx from '../audio/end_call.mp3';

class AudioManager {
  private static instance: AudioManager;
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private interactionHandlers: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Play audio and keep it persistent
  play(key: string, src: string, loop: boolean = false, volume: number = 1): void {
    let audio = this.audioElements.get(key);

    if (!audio) {
      audio = new Audio(src);
      this.audioElements.set(key, audio);
    } else if (audio.src !== new URL(src, window.location.origin).href) {
      audio.src = src;
      audio.load();
    }

    // Always ensure these properties are set
    audio.loop = loop;
    audio.volume = volume;

    const startPlaying = () => {
      audio!.play().catch(error => {
        console.warn(`[AudioManager] Playback failed for ${key}:`, error);
        this.setupInteractionFallback(key);
      });
    };

    if (audio.paused || audio.ended) {
      if (audio.ended) {
        audio.currentTime = 0;
      }
      startPlaying();
    } else {
      // If already playing but we want it to loop, ensure it's set
      audio.loop = loop;
    }
  }

  private setupInteractionFallback(key: string): void {
    if (this.interactionHandlers.has(key)) return;

    const handler = () => {
      const audio = this.audioElements.get(key);
      if (audio && (audio.paused || audio.ended)) {
        audio.play().catch(() => {});
      }
      this.interactionHandlers.delete(key);
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', handler);
    };

    this.interactionHandlers.set(key, handler);
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('keydown', handler);
  }

  // Stop specific audio
  stop(key: string): void {
    const audio = this.audioElements.get(key);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      
      // Clean up fallback handler if it exists
      const handler = this.interactionHandlers.get(key);
      if (handler) {
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
        document.removeEventListener('keydown', handler);
        this.interactionHandlers.delete(key);
      }
    }
  }

  // Stop all audio
  stopAll(): void {
    this.audioElements.forEach((_, key) => {
      this.stop(key);
    });
  }

  // Check if audio is playing
  isPlaying(key: string): boolean {
    const audio = this.audioElements.get(key);
    return !!audio && !audio.paused && !audio.ended;
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Export convenience functions using imported assets for reliable Vite bundling
export const playJoinCall = () => audioManager.play('joinCall', joinCallSfx, false, 1.0);
export const playCrowd = () => audioManager.play('crowd', croudSfx, true, 0.4); // Increased volume slightly
export const playEndCall = () => audioManager.play('endCall', endCallSfx, false, 1.0);
export const stopCrowd = () => audioManager.stop('crowd');
export const stopAllAudio = () => audioManager.stopAll();