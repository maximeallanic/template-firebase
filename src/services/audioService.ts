
// Simple Synthesizer for Game Sound Effects using Web Audio API
// No external assets required!

class AudioService {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;
    private ambientOscillators: OscillatorNode[] = [];
    private ambientGain: GainNode | null = null;
    private currentAmbience: 'lobby' | 'tension' | 'none' = 'none';

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
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Toggle mute
    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAmbient();
        } else {
            // Restart current ambience if re-enabled
            if (this.currentAmbience !== 'none') {
                const type = this.currentAmbience;
                this.stopAmbient();
                this.playAmbient(type);
            }
        }
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

    // --- AMBIENT LOOPS ---

    public playAmbient(type: 'lobby' | 'tension') {
        if (!this.ctx || !this.enabled || this.currentAmbience === type) {
            if (this.currentAmbience === type) return; // Already playing
            // logic to start if ctx ready
        }
        this.init();
        this.stopAmbient(); // Clear previous
        this.currentAmbience = type;

        if (!this.ctx) return;

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.connect(this.ctx.destination);
        this.ambientGain.gain.value = 0.05; // Low volume background

        if (type === 'lobby') {
            // Low, warm drone
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 110; // A2
            osc1.connect(this.ambientGain);
            osc1.start();
            this.ambientOscillators.push(osc1);

            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.value = 110.5; // Slight detune for warmth
            osc2.connect(this.ambientGain);
            osc2.start();
            this.ambientOscillators.push(osc2);
        } else if (type === 'tension') {
            // Deep, pulsing heartbeat drone
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.value = 55; // A1

            // LFO for pulsing
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 1; // 1Hz pulse (60bpm)
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 500; // Depth of filter mod

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 100;

            lfo.connect(filter.frequency);
            osc1.connect(filter);
            filter.connect(this.ambientGain);

            osc1.start();
            lfo.start();
            this.ambientOscillators.push(osc1, lfo);
        }
    }

    public stopAmbient() {
        this.ambientOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.ambientOscillators = [];
        if (this.ambientGain) {
            this.ambientGain.disconnect();
            this.ambientGain = null;
        }
        this.currentAmbience = 'none';
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
