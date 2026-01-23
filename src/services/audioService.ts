// Audio Service with Web Audio API
// Uses Web Audio API to prevent sounds from appearing in system media controls

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

interface ActiveSound {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

class AudioService {
  private enabled = false;
  private masterVolume = 1.0;
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private bufferCache: Map<SoundId, AudioBuffer> = new Map();
  private activeSounds: Map<SoundId, ActiveSound> = new Map();
  private initialized = false;
  private loadingPromises: Map<SoundId, Promise<AudioBuffer | null>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.init(), { once: true });
      window.addEventListener('touchstart', () => this.init(), { once: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // Resume if suspended (browsers suspend AudioContext until user interaction)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          // Ignore resume errors
        });
      }
      return this.audioContext;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      this.audioContext = new AudioContextClass();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = this.masterVolume;
      return this.audioContext;
    } catch {
      return null;
    }
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Initialize AudioContext on user interaction
    this.getAudioContext();

    // Preload critical sounds
    await this.preloadSounds(PRELOAD_SOUNDS);
  }

  private async loadAudioBuffer(soundId: SoundId): Promise<AudioBuffer | null> {
    // Return cached buffer if available
    const cached = this.bufferCache.get(soundId);
    if (cached) return cached;

    // Return existing loading promise if in progress
    const existingPromise = this.loadingPromises.get(soundId);
    if (existingPromise) return existingPromise;

    // Start loading
    const loadPromise = this.doLoadAudioBuffer(soundId);
    this.loadingPromises.set(soundId, loadPromise);

    try {
      const buffer = await loadPromise;
      return buffer;
    } finally {
      this.loadingPromises.delete(soundId);
    }
  }

  private async doLoadAudioBuffer(soundId: SoundId): Promise<AudioBuffer | null> {
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    const config = SOUND_CONFIG[soundId];
    const absolutePath = config.file.startsWith('/') ? config.file : `/${config.file}`;

    try {
      const response = await fetch(absolutePath);
      if (!response.ok) {
        console.warn(`Failed to fetch sound ${soundId}: ${response.status}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      this.bufferCache.set(soundId, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.warn(`Failed to load audio buffer for ${soundId}:`, e);
      return null;
    }
  }

  public async preloadSounds(soundIds: SoundId[]): Promise<void> {
    await Promise.all(soundIds.map((id) => this.loadAudioBuffer(id)));
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

    // Update master gain node
    if (this.masterGainNode && this.audioContext) {
      this.masterGainNode.gain.setValueAtTime(
        this.masterVolume,
        this.audioContext.currentTime
      );
    }
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

    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGainNode) return;

    // Stop any currently playing instance of this sound
    this.stop(soundId, 0);

    const buffer = await this.loadAudioBuffer(soundId);
    if (!buffer) return;

    const config = SOUND_CONFIG[soundId];

    try {
      // Create source node
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = options?.loop ?? config.loop;

      // Create gain node for this sound
      const gainNode = ctx.createGain();
      const volume = options?.volume ?? config.defaultVolume;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);

      // Connect: source -> gainNode -> masterGain -> destination
      source.connect(gainNode);
      gainNode.connect(this.masterGainNode);

      // Track active sound
      this.activeSounds.set(soundId, { source, gainNode });

      // Clean up when sound ends naturally
      source.onended = () => {
        const current = this.activeSounds.get(soundId);
        if (current?.source === source) {
          this.activeSounds.delete(soundId);
        }
      };

      // Start playback
      source.start(0);
    } catch (e) {
      console.warn(`Failed to play sound ${soundId}:`, e);
      this.activeSounds.delete(soundId);
    }
  }

  public stop(soundId: SoundId, fadeOutMs?: number): void {
    const active = this.activeSounds.get(soundId);
    if (!active) return;

    const ctx = this.getAudioContext();
    if (!ctx) {
      // No context, just clean up
      this.activeSounds.delete(soundId);
      return;
    }

    const config = SOUND_CONFIG[soundId];
    const fadeDuration = fadeOutMs ?? config.fadeOutMs;

    if (fadeDuration > 0) {
      // Smooth fade-out using Web Audio API
      const fadeEndTime = ctx.currentTime + fadeDuration / 1000;

      // Get current gain value
      const currentGain = active.gainNode.gain.value;

      // Cancel any scheduled changes and set current value
      active.gainNode.gain.cancelScheduledValues(ctx.currentTime);
      active.gainNode.gain.setValueAtTime(currentGain, ctx.currentTime);

      // Ramp to near-zero (can't ramp to exactly 0)
      active.gainNode.gain.linearRampToValueAtTime(0.001, fadeEndTime);

      // Stop source after fade completes
      try {
        active.source.stop(fadeEndTime);
      } catch {
        // Source may have already stopped
      }

      this.activeSounds.delete(soundId);
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
    // Create a copy of keys to avoid mutation during iteration
    const soundIds = Array.from(this.activeSounds.keys());
    for (const soundId of soundIds) {
      this.stop(soundId, fadeOutMs);
    }
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

    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      // Connect through master gain for volume control
      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore errors for timer tick
    }
  }
}

export const audioService = new AudioService();
