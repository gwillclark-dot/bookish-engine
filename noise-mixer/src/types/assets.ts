export interface VideoSource {
  src: string;
  type: 'video/webm' | 'video/mp4';
}

export interface Background {
  poster: string;
  sources: VideoSource[];
}

export interface AudioTrack {
  id: string;
  name: string;
  src: string;
  defaultVolume: number;
}

export interface Scene {
  id: string;
  name: string;
  background: Background;
  tracks: AudioTrack[];
}

export interface AssetsConfig {
  scenes: Scene[];
}

export interface TrackState {
  id: string;
  name: string;
  volume: number;
  buffer: AudioBuffer | null;
  isLoading: boolean;
  error: string | null;
}
