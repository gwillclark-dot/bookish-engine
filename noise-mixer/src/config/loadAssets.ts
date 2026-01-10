import type { AssetsConfig, Scene, AudioTrack, Background, VideoSource } from '../types/assets';

/**
 * Type guard to check if value is a VideoSource
 */
function isVideoSource(value: any): value is VideoSource {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.src === 'string' &&
    (value.type === 'video/webm' || value.type === 'video/mp4')
  );
}

/**
 * Type guard to check if value is a Background
 */
function isBackground(value: any): value is Background {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.poster === 'string' &&
    Array.isArray(value.sources) &&
    value.sources.every(isVideoSource)
  );
}

/**
 * Type guard to check if value is an AudioTrack
 */
function isAudioTrack(value: any): value is AudioTrack {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.src === 'string' &&
    typeof value.defaultVolume === 'number' &&
    value.defaultVolume >= 0 &&
    value.defaultVolume <= 1
  );
}

/**
 * Type guard to check if value is a Scene
 */
function isScene(value: any): value is Scene {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isBackground(value.background) &&
    Array.isArray(value.tracks) &&
    value.tracks.length > 0 &&
    value.tracks.every(isAudioTrack)
  );
}

/**
 * Type guard to check if value is an AssetsConfig
 */
function isAssetsConfig(value: any): value is AssetsConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray(value.scenes) &&
    value.scenes.length > 0 &&
    value.scenes.every(isScene)
  );
}

/**
 * Load and validate assets.json configuration.
 * @param url - Path to assets.json (default: /assets.json)
 * @returns Validated AssetsConfig
 * @throws Error if loading fails or validation fails
 */
export async function loadAssets(url = '/assets.json'): Promise<AssetsConfig> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load assets.json: ${response.statusText}`);
    }

    const data = await response.json();

    if (!isAssetsConfig(data)) {
      throw new Error('Invalid assets.json structure. Check console for details.');
    }

    console.log('✓ Assets loaded successfully:', {
      scenes: data.scenes.length,
      tracks: data.scenes[0]?.tracks.length || 0,
    });

    return data;
  } catch (error) {
    console.error('Failed to load assets:', error);
    throw error;
  }
}

/**
 * Get the best supported video source for the current browser.
 * Checks each source type and returns the first supported one.
 */
export function getBestVideoSource(sources: VideoSource[]): string | null {
  const video = document.createElement('video');

  for (const source of sources) {
    const canPlay = video.canPlayType(source.type);
    if (canPlay === 'probably' || canPlay === 'maybe') {
      return source.src;
    }
  }

  // Fallback to first source if none explicitly supported
  return sources[0]?.src || null;
}
