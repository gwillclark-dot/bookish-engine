import { VolumeSlider } from './VolumeSlider';
import type { TrackState, Scene } from '../types/assets';

interface ControlPanelProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  tracks: TrackState[];
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  currentScene: Scene;
  allScenes: Scene[];
  onSceneChange: (sceneId: string) => void;
  onRandomize: () => void;
}

export function ControlPanel({
  isPlaying,
  onPlayPause,
  masterVolume,
  onMasterVolumeChange,
  tracks,
  onTrackVolumeChange,
  currentScene,
  allScenes,
  onSceneChange,
  onRandomize,
}: ControlPanelProps) {
  const allTracksLoaded = tracks.every((t) => t.buffer !== null || t.error !== null);
  const anyErrors = tracks.some((t) => t.error !== null);

  return (
    <div className="control-panel">
      <div className="control-panel__header">
        <h1 className="control-panel__title">🎧 Noise Mixer</h1>
        {allScenes.length > 1 && (
          <select
            className="control-panel__scene-select"
            value={currentScene.id}
            onChange={(e) => onSceneChange(e.target.value)}
          >
            {allScenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="control-panel__main-controls">
        <button
          className={`control-panel__play-button ${isPlaying ? 'playing' : ''}`}
          onClick={onPlayPause}
          disabled={!allTracksLoaded || anyErrors}
          title="Spacebar"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="control-panel__randomize-button"
          onClick={onRandomize}
          title="Randomize volumes (R)"
        >
          🎲 Randomize
        </button>
      </div>

      <div className="control-panel__volume-section">
        <VolumeSlider
          label="Master Volume"
          value={masterVolume}
          onChange={onMasterVolumeChange}
        />
      </div>

      <div className="control-panel__divider" />

      <div className="control-panel__tracks">
        {tracks.map((track) => (
          <VolumeSlider
            key={track.id}
            label={track.name}
            value={track.volume}
            onChange={(vol) => onTrackVolumeChange(track.id, vol)}
            isLoading={track.isLoading}
            error={track.error}
          />
        ))}
      </div>

      <div className="control-panel__footer">
        <div className="control-panel__shortcuts">
          <span className="control-panel__shortcut">
            <kbd>Space</kbd> Play/Pause
          </span>
          <span className="control-panel__shortcut">
            <kbd>M</kbd> Mute
          </span>
          <span className="control-panel__shortcut">
            <kbd>R</kbd> Randomize
          </span>
        </div>
      </div>
    </div>
  );
}
