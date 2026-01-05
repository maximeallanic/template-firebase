// Simple Synthesizer for Game Sound Effects using Web Audio API
// No external assets required!

// Safari fallback for AudioContext
declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext;
    }
}

class AudioService {
    private ctx: AudioContext | null = null;
    private enabled: boolean = false;

    constructor() {
        try {
            // Lazy init to avoid auto-play policy issues until interaction
            if (typeof window !== 'undefined') {
                window.addEventListener('click', () => this.init(), { once: true });
            }
        } catch (e) {
            console.warn("AudioContext not supported", e);
        }
    }

    private init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Toggle mute
    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    // --- SOUND FX LIBRARY ---

    public playClick() {
        this.init();
        // High crisp blip
        this.playTone(800, 'sine', 0.1, 0, 0.05);
    }

    public playTransition() {
        this.init();
        if (!this.ctx || !this.enabled) return;
        // Whoosh effect (Noise buffer or sweep)
        // Simulating with a swept sine for now
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    public playJoin() {
        this.init();
        this.playTone(440, 'sine', 0.1, 0);
        this.playTone(554, 'sine', 0.1, 0.1); // C#
        this.playTone(659, 'sine', 0.3, 0.2); // E
    }

    public playSuccess() {
        this.init();
        this.playTone(523.25, 'triangle', 0.1, 0);   // C
        this.playTone(659.25, 'triangle', 0.1, 0.1); // E
        this.playTone(783.99, 'triangle', 0.1, 0.2); // G
        this.playTone(1046.50, 'triangle', 0.4, 0.3);// High C
    }

    public playError() {
        this.init();
        this.playTone(150, 'sawtooth', 0.3, 0);
        this.playTone(140, 'sawtooth', 0.3, 0.1);
    }

    public playTimerTick() {
        this.init();
        this.playTone(800, 'square', 0.05, 0, 0.05);
    }

    public playWinRound() {
        this.init();
        const now = 0;
        this.playTone(523, 'square', 0.2, now);
        this.playTone(523, 'square', 0.2, now + 0.2);
        this.playTone(523, 'square', 0.2, now + 0.4);
        this.playTone(659, 'square', 0.6, now + 0.6);
    }
}

export const audioService = new AudioService();
