import type { AudioTrack } from '../types/assets';

const FADE_DURATION = 0.08; // 80ms for fade in/out
const RAMP_DURATION = 0.1; // 100ms for volume slider changes

interface TrackNode {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  buffer: AudioBuffer | null;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<string, TrackNode> = new Map();
  private isPlaying = false;
  private isUnlocked = false;

  /**
   * Initialize the audio context and master gain node.
   * Must be called from a user gesture on iOS/mobile.
   */
  async unlock(): Promise<void> {
    if (this.isUnlocked) return;

    try {
      // Create AudioContext (Safari needs webkitAudioContext)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();

      // Create master gain node
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);

      // Resume context if suspended (iOS requirement)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.isUnlocked = true;
      console.log('Audio context unlocked');
    } catch (error) {
      console.error('Failed to unlock audio context:', error);
      throw error;
    }
  }

  /**
   * Load an audio buffer from a URL.
   */
  async loadTrack(track: AudioTrack): Promise<AudioBuffer> {
    if (!this.context) {
      throw new Error('Audio context not initialized. Call unlock() first.');
    }

    try {
      const response = await fetch(track.src);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${track.src}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      // Create gain node for this track
      const gainNode = this.context.createGain();
      gainNode.gain.value = track.defaultVolume;
      gainNode.connect(this.masterGain!);

      // Store track node
      this.tracks.set(track.id, {
        source: null,
        gainNode,
        buffer: audioBuffer,
      });

      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load track ${track.id}:`, error);
      throw error;
    }
  }

  /**
   * Start playing all loaded tracks with fade-in.
   */
  play(): void {
    if (!this.context || !this.masterGain || this.isPlaying) return;

    this.isPlaying = true;
    const now = this.context.currentTime;

    // Fade in master gain
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(1, now + FADE_DURATION);

    // Start each track
    this.tracks.forEach((trackNode, trackId) => {
      if (trackNode.buffer) {
        this.startTrack(trackId);
      }
    });
  }

  /**
   * Pause all tracks with fade-out.
   */
  pause(): void {
    if (!this.context || !this.masterGain || !this.isPlaying) return;

    const now = this.context.currentTime;

    // Fade out master gain
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + FADE_DURATION);

    // Stop all sources after fade completes
    setTimeout(() => {
      this.tracks.forEach((trackNode) => {
        if (trackNode.source) {
          trackNode.source.stop();
          trackNode.source.disconnect();
          trackNode.source = null;
        }
      });
      this.isPlaying = false;
    }, FADE_DURATION * 1000 + 50); // Add 50ms buffer
  }

  /**
   * Start an individual track (used internally).
   */
  private startTrack(trackId: string): void {
    if (!this.context) return;

    const trackNode = this.tracks.get(trackId);
    if (!trackNode || !trackNode.buffer) return;

    // Stop existing source if any
    if (trackNode.source) {
      trackNode.source.stop();
      trackNode.source.disconnect();
    }

    // Create new source
    const source = this.context.createBufferSource();
    source.buffer = trackNode.buffer;
    source.loop = true;
    source.connect(trackNode.gainNode);
    source.start(0);

    trackNode.source = source;
  }

  /**
   * Set volume for a specific track with smooth ramping.
   */
  setTrackVolume(trackId: string, volume: number): void {
    if (!this.context) return;

    const trackNode = this.tracks.get(trackId);
    if (!trackNode) return;

    const now = this.context.currentTime;
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // Smooth ramp to avoid zipper noise
    trackNode.gainNode.gain.cancelScheduledValues(now);
    trackNode.gainNode.gain.setValueAtTime(trackNode.gainNode.gain.value, now);
    trackNode.gainNode.gain.linearRampToValueAtTime(clampedVolume, now + RAMP_DURATION);
  }

  /**
   * Set master volume with smooth ramping.
   */
  setMasterVolume(volume: number): void {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const clampedVolume = Math.max(0, Math.min(1, volume));

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(clampedVolume, now + RAMP_DURATION);
  }

  /**
   * Get current master volume.
   */
  getMasterVolume(): number {
    return this.masterGain?.gain.value ?? 0.7;
  }

  /**
   * Get current track volume.
   */
  getTrackVolume(trackId: string): number {
    const trackNode = this.tracks.get(trackId);
    return trackNode?.gainNode.gain.value ?? 0;
  }

  /**
   * Check if audio is currently playing.
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if audio context is unlocked.
   */
  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Clean up all audio resources.
   */
  dispose(): void {
    this.pause();
    this.tracks.clear();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.masterGain = null;
    this.isUnlocked = false;
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}
