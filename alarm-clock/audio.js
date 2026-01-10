/**
 * Bonk Alarm - Audio System
 * Generates alarm sounds using Web Audio API
 */

class AlarmAudio {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.oscillators = [];
        this.gainNodes = [];
        this.intervalId = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume context if suspended (required for iOS)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Classic alarm clock beep pattern
     * Two-tone alternating beeps
     */
    playAlarm() {
        if (this.isPlaying) return;

        this.init();
        this.isPlaying = true;

        const playBeepSequence = () => {
            if (!this.isPlaying) return;

            // Create two beeps
            this.playBeep(880, 0.15); // High A
            setTimeout(() => {
                if (this.isPlaying) this.playBeep(698.46, 0.15); // F
            }, 200);
            setTimeout(() => {
                if (this.isPlaying) this.playBeep(880, 0.15); // High A
            }, 400);
            setTimeout(() => {
                if (this.isPlaying) this.playBeep(698.46, 0.15); // F
            }, 600);
        };

        // Play immediately
        playBeepSequence();

        // Then repeat every 1.5 seconds
        this.intervalId = setInterval(playBeepSequence, 1500);
    }

    /**
     * Play a single beep
     */
    playBeep(frequency, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Attack and release envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        // Track for cleanup
        this.oscillators.push(oscillator);
        this.gainNodes.push(gainNode);
    }

    /**
     * Play bonk sound effect
     */
    playBonk() {
        this.init();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Start high and drop quickly for "bonk" effect
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play launch whoosh sound
     */
    playWhoosh() {
        this.init();

        // White noise filtered for whoosh
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.4);
        filter.Q.value = 1;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start();
        noise.stop(this.audioContext.currentTime + 0.5);
    }

    /**
     * Stop alarm sound
     */
    stop() {
        this.isPlaying = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Clean up oscillators
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        });

        this.oscillators = [];
        this.gainNodes = [];
    }

    /**
     * Play dismiss success sound
     */
    playDismiss() {
        this.init();

        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, i * 80);
        });
    }
}

// Global instance
const alarmAudio = new AlarmAudio();
