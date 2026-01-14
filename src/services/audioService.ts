// Audio Service with custom sound files
// Uses HTMLAudioElement for better Capacitor compatibility

export type SoundId =
  | 'background'
  | 'correct'
  | 'incorrect'
  | 'slide'
  | 'timer'
  | 'buttonPop'
  | 'cookingLoading'
  | 'dishReady'
  | 'dishOut'
  | 'curtainsOpen'
  | 'curtainsClose'
  | 'nextQuestion'
  | 'difficultyEasy'
  | 'difficultyMid'
  | 'difficultyHard'
  | 'difficultyHell'
  | 'applause';

interface SoundConfig {
  file: string;
  loop: boolean;
  fadeOutMs: number;
  defaultVolume: number;
}

const SOUND_CONFIG: Record<SoundId, SoundConfig> = {
  background: {
    file: 'sounds/background.mp3',
    loop: true,
    fadeOutMs: 1000,
    defaultVolume: 0.3,
  },
  correct: {
    file: 'sounds/correct.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  incorrect: {
    file: 'sounds/incorrect.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  slide: {
    file: 'sounds/slide.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.4,
  },
  timer: {
    file: 'sounds/timer.mp3',
    loop: false,
    fadeOutMs: 500,
    defaultVolume: 0.4,
  },
  buttonPop: {
    file: 'sounds/button-pop.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.3,
  },
  cookingLoading: {
    file: 'sounds/cooking-loading.mp3',
    loop: true,
    fadeOutMs: 1000,
    defaultVolume: 0.4,
  },
  dishReady: {
    file: 'sounds/dish-ready.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  dishOut: {
    file: 'sounds/dish-out.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  curtainsOpen: {
    file: 'sounds/curtains-open.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  curtainsClose: {
    file: 'sounds/curtains-close.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  nextQuestion: {
    file: 'sounds/next-question.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyEasy: {
    file: 'sounds/difficulty-easy.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyMid: {
    file: 'sounds/difficulty-mid.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyHard: {
    file: 'sounds/difficulty-hard.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyHell: {
    file: 'sounds/difficulty-hell.mp3',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  applause: {
    file: 'sounds/applause.mp3',
    loop: false,
    fadeOutMs: 2000,
    defaultVolume: 0.6,
  },
};

// Sounds to preload on first interaction
const PRELOAD_SOUNDS: SoundId[] = [
  'buttonPop',
  'correct',
  'incorrect',
  'background',
];

class AudioService {
  private enabled = false;
  private masterVolume = 1.0;
  private audioCache: Map<SoundId, HTMLAudioElement> = new Map();
  private activeSounds: Map<SoundId, HTMLAudioElement> = new Map();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.init(), { once: true });
      window.addEventListener('touchstart', () => this.init(), { once: true });
    }
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    // Preload critical sounds
    await this.preloadSounds(PRELOAD_SOUNDS);
  }

  private createAudio(soundId: SoundId): HTMLAudioElement {
    const config = SOUND_CONFIG[soundId];
    const audio = new Audio(config.file);
    audio.preload = 'auto';
    audio.loop = config.loop;
    audio.volume = config.defaultVolume * this.masterVolume;
    return audio;
  }

  private getOrCreateAudio(soundId: SoundId): HTMLAudioElement {
    let audio = this.audioCache.get(soundId);
    if (!audio) {
      audio = this.createAudio(soundId);
      this.audioCache.set(soundId, audio);
    }
    return audio;
  }

  public async preloadSounds(soundIds: SoundId[]): Promise<void> {
    await Promise.all(
      soundIds.map(id => {
        return new Promise<void>((resolve) => {
          const audio = this.getOrCreateAudio(id);
          if (audio.readyState >= 2) {
            resolve();
          } else {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', () => resolve(), { once: true });
            audio.load();
          }
        });
      })
    );
  }

  public async preloadAll(): Promise<void> {
    const allSounds = Object.keys(SOUND_CONFIG) as SoundId[];
    await this.preloadSounds(allSounds);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update volume on all cached sounds
    this.audioCache.forEach((audio, soundId) => {
      const config = SOUND_CONFIG[soundId];
      audio.volume = config.defaultVolume * this.masterVolume;
    });
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public async play(
    soundId: SoundId,
    options?: { loop?: boolean; volume?: number }
  ): Promise<void> {
    if (!this.enabled) return;

    await this.init();

    // Stop any currently playing instance of this sound
    this.stop(soundId, 0);

    const config = SOUND_CONFIG[soundId];

    // Create a new audio instance for playing (allows overlapping sounds)
    const audio = this.createAudio(soundId);

    if (options?.loop !== undefined) {
      audio.loop = options.loop;
    }

    const volume = (options?.volume ?? config.defaultVolume) * this.masterVolume;
    audio.volume = volume;

    this.activeSounds.set(soundId, audio);

    audio.onended = () => {
      const current = this.activeSounds.get(soundId);
      if (current === audio) {
        this.activeSounds.delete(soundId);
      }
    };

    try {
      await audio.play();
    } catch (e) {
      console.warn(`Failed to play sound ${soundId}:`, e);
      this.activeSounds.delete(soundId);
    }
  }

  public stop(soundId: SoundId, fadeOutMs?: number): void {
    const audio = this.activeSounds.get(soundId);
    if (!audio) return;

    const config = SOUND_CONFIG[soundId];
    const fadeDuration = fadeOutMs ?? config.fadeOutMs;

    if (fadeDuration > 0) {
      // Fade out
      const startVolume = audio.volume;
      const steps = 20;
      const stepDuration = fadeDuration / steps;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(0, startVolume - volumeStep * currentStep);

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          audio.pause();
          audio.currentTime = 0;
          this.activeSounds.delete(soundId);
        }
      }, stepDuration);
    } else {
      // Stop immediately
      audio.pause();
      audio.currentTime = 0;
      this.activeSounds.delete(soundId);
    }
  }

  public stopAll(fadeOutMs = 500): void {
    this.activeSounds.forEach((_, soundId) => {
      this.stop(soundId, fadeOutMs);
    });
  }

  public isPlaying(soundId: SoundId): boolean {
    return this.activeSounds.has(soundId);
  }

  // ==========================================
  // Legacy methods for backward compatibility
  // ==========================================

  public playClick(): void {
    this.play('buttonPop');
  }

  public playSuccess(): void {
    this.play('correct');
  }

  public playError(): void {
    this.play('incorrect');
  }

  public playJoin(): void {
    this.play('dishReady');
  }

  public playTransition(): void {
    this.play('slide');
  }

  public playWinRound(): void {
    this.play('applause');
  }

  public playTimerTick(): void {
    // For timer ticks, we use a simple synthesized beep via AudioContext
    if (!this.enabled) return;

    try {
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      gain.gain.setValueAtTime(0.05 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);

      // Clean up after sound finishes
      setTimeout(() => ctx.close(), 100);
    } catch (e) {
      // Ignore errors for timer tick
    }
  }
}

export const audioService = new AudioService();
