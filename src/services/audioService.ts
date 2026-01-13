// Audio Service with custom sound files
// Supports preloading, looping, fade-in/out, and volume control

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

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

interface ActiveSound {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
}

const SOUND_CONFIG: Record<SoundId, SoundConfig> = {
  background: {
    file: '/sounds/SVS_background_v2_1.m4a',
    loop: true,
    fadeOutMs: 1000,
    defaultVolume: 0.3,
  },
  correct: {
    file: '/sounds/SVS_correct_chime.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  incorrect: {
    file: '/sounds/SVS_incorrect_chime.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  slide: {
    file: '/sounds/SVS_slide_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.4,
  },
  timer: {
    file: '/sounds/SVS_timer.m4a',
    loop: false,
    fadeOutMs: 500,
    defaultVolume: 0.4,
  },
  buttonPop: {
    file: '/sounds/SVS_button_pop.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.3,
  },
  cookingLoading: {
    file: '/sounds/SVS_cooking_loading.m4a',
    loop: true,
    fadeOutMs: 1000,
    defaultVolume: 0.4,
  },
  dishReady: {
    file: '/sounds/SVS_dish_ready.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  dishOut: {
    file: '/sounds/SVS_dish_out_v4.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  curtainsOpen: {
    file: '/sounds/SVS_curtains_open_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  curtainsClose: {
    file: '/sounds/SVS_curtains_close_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  nextQuestion: {
    file: '/sounds/SVS_nextquestion_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyEasy: {
    file: '/sounds/SVS_difficulty_easy_button_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyMid: {
    file: '/sounds/SVS_difficulty_mid_button_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyHard: {
    file: '/sounds/SVS_difficulty_hard_button_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  difficultyHell: {
    file: '/sounds/SVS_difficulty_hell_button_v2.m4a',
    loop: false,
    fadeOutMs: 0,
    defaultVolume: 0.5,
  },
  applause: {
    file: '/sounds/SVS_audience_applause.m4a',
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
  private ctx: AudioContext | null = null;
  private enabled = false;
  private masterVolume = 1.0;
  private bufferCache: Map<SoundId, AudioBuffer> = new Map();
  private activeSounds: Map<SoundId, ActiveSound> = new Map();
  private loadingPromises: Map<SoundId, Promise<AudioBuffer | null>> = new Map();
  private initialized = false;
  // Track sounds that should be cancelled even if still loading
  private cancelledSounds: Set<SoundId> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.init(), { once: true });
      window.addEventListener('touchstart', () => this.init(), { once: true });
    }
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }

      if (this.ctx?.state === 'suspended') {
        await this.ctx.resume();
      }

      this.initialized = true;

      // Preload critical sounds
      await this.preloadSounds(PRELOAD_SOUNDS);
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  private async loadSound(soundId: SoundId): Promise<AudioBuffer | null> {
    // Return cached buffer if available
    const cached = this.bufferCache.get(soundId);
    if (cached) return cached;

    // Return existing loading promise if in progress
    const existingPromise = this.loadingPromises.get(soundId);
    if (existingPromise) return existingPromise;

    // Create new loading promise
    const loadPromise = this.fetchAndDecodeSound(soundId);
    this.loadingPromises.set(soundId, loadPromise);

    try {
      const buffer = await loadPromise;
      if (buffer) {
        this.bufferCache.set(soundId, buffer);
      }
      return buffer;
    } finally {
      this.loadingPromises.delete(soundId);
    }
  }

  private async fetchAndDecodeSound(soundId: SoundId): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;

    const config = SOUND_CONFIG[soundId];
    try {
      const response = await fetch(config.file);
      if (!response.ok) {
        console.warn(`Failed to fetch sound: ${config.file}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.warn(`Failed to load sound ${soundId}:`, e);
      return null;
    }
  }

  public async preloadSounds(soundIds: SoundId[]): Promise<void> {
    await Promise.all(soundIds.map(id => this.loadSound(id)));
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

    // Update volume on all active sounds
    this.activeSounds.forEach((active, soundId) => {
      const config = SOUND_CONFIG[soundId];
      active.gainNode.gain.setValueAtTime(
        config.defaultVolume * this.masterVolume,
        this.ctx?.currentTime || 0
      );
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
    if (!this.ctx) return;

    // Stop any currently playing instance of this sound
    if (this.activeSounds.has(soundId)) {
      this.stop(soundId, 0);
    }

    // Clear cancelled state AFTER stopping previous instance
    // This ensures the new play request is not affected by the stop above
    this.cancelledSounds.delete(soundId);

    const buffer = await this.loadSound(soundId);
    if (!buffer) return;

    // Check if sound was cancelled while loading
    if (this.cancelledSounds.has(soundId)) {
      console.log(`[AudioService] play(${soundId}): cancelled while loading, not playing`);
      this.cancelledSounds.delete(soundId);
      return;
    }
    console.log(`[AudioService] play(${soundId}): starting playback`);

    const config = SOUND_CONFIG[soundId];
    const source = this.ctx.createBufferSource();
    const gainNode = this.ctx.createGain();

    source.buffer = buffer;
    source.loop = options?.loop ?? config.loop;

    const volume = (options?.volume ?? config.defaultVolume) * this.masterVolume;
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    const activeSound: ActiveSound = {
      source,
      gainNode,
      startTime: this.ctx.currentTime,
    };

    this.activeSounds.set(soundId, activeSound);

    source.onended = () => {
      this.activeSounds.delete(soundId);
    };

    source.start(0);
  }

  public stop(soundId: SoundId, fadeOutMs?: number): void {
    // Mark as cancelled in case it's still loading
    this.cancelledSounds.add(soundId);

    const active = this.activeSounds.get(soundId);
    if (!active || !this.ctx) {
      console.log(`[AudioService] stop(${soundId}): not found in activeSounds, marked as cancelled`);
      return;
    }
    console.log(`[AudioService] stop(${soundId}): stopping with fade ${fadeOutMs ?? SOUND_CONFIG[soundId].fadeOutMs}ms`);

    const config = SOUND_CONFIG[soundId];
    const fadeDuration = fadeOutMs ?? config.fadeOutMs;

    if (fadeDuration > 0) {
      // Fade out
      const now = this.ctx.currentTime;
      active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now);
      active.gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration / 1000);

      // Stop after fade completes
      setTimeout(() => {
        try {
          active.source.stop();
        } catch {
          // Source may have already stopped
        }
        this.activeSounds.delete(soundId);
      }, fadeDuration);
    } else {
      // Stop immediately
      try {
        active.source.stop();
      } catch {
        // Source may have already stopped
      }
      this.activeSounds.delete(soundId);
    }
  }

  public stopAll(fadeOutMs = 500): void {
    // Mark all possible sounds as cancelled
    (Object.keys(SOUND_CONFIG) as SoundId[]).forEach(soundId => {
      this.cancelledSounds.add(soundId);
    });

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
    // For timer ticks, we use a simple synthesized beep
    // to avoid loading the full timer sound for each tick
    if (!this.ctx || !this.enabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.05 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const audioService = new AudioService();
