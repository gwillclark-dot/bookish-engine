import { useEffect, useState, useCallback } from 'react';
import { VideoBackground } from './components/VideoBackground';
import { ControlPanel } from './components/ControlPanel';
import { UnlockOverlay } from './components/UnlockOverlay';
import { loadAssets } from './config/loadAssets';
import { getAudioEngine } from './audio/AudioEngine';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AssetsConfig, Scene, TrackState } from './types/assets';
import './App.css';

function App() {
  const [assets, setAssets] = useState<AssetsConfig | null>(null);
  const [currentSceneId, setCurrentSceneId] = useLocalStorage<string>('noisemixer:sceneId', 'default');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useLocalStorage<number>('noisemixer:masterVolume', 0.7);
  const [tracks, setTracks] = useState<TrackState[]>([]);
  const [trackVolumes, setTrackVolumes] = useLocalStorage<Record<string, number>>('noisemixer:trackVolumes', {});
  const [loadError, setLoadError] = useState<string | null>(null);

  const audioEngine = getAudioEngine();

  // Load assets on mount
  useEffect(() => {
    loadAssets()
      .then((config) => {
        setAssets(config);
        // Validate scene ID exists
        if (!config.scenes.find((s) => s.id === currentSceneId)) {
          setCurrentSceneId(config.scenes[0].id);
        }
      })
      .catch((error) => {
        console.error('Failed to load assets:', error);
        setLoadError(error.message);
      });
  }, []);

  // Current scene
  const currentScene = assets?.scenes.find((s) => s.id === currentSceneId) || assets?.scenes[0];

  // Initialize tracks when scene changes
  useEffect(() => {
    if (!currentScene) return;

    const newTracks: TrackState[] = currentScene.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      volume: trackVolumes[track.id] ?? track.defaultVolume,
      buffer: null,
      isLoading: true,
      error: null,
    }));

    setTracks(newTracks);
  }, [currentScene, trackVolumes]);

  // Load audio buffers when unlocked
  useEffect(() => {
    if (!isUnlocked || !currentScene) return;

    currentScene.tracks.forEach(async (track, index) => {
      try {
        const buffer = await audioEngine.loadTrack(track);
        setTracks((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], buffer, isLoading: false };
          return updated;
        });
      } catch (error: any) {
        console.error(`Failed to load track ${track.id}:`, error);
        setTracks((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], error: error.message, isLoading: false };
          return updated;
        });
      }
    });
  }, [isUnlocked, currentScene]);

  // Sync master volume to engine
  useEffect(() => {
    if (isUnlocked) {
      audioEngine.setMasterVolume(masterVolume);
    }
  }, [masterVolume, isUnlocked]);

  // Handle unlock
  const handleUnlock = useCallback(async () => {
    try {
      await audioEngine.unlock();
      setIsUnlocked(true);
    } catch (error) {
      console.error('Failed to unlock audio:', error);
      alert('Failed to initialize audio. Please try again.');
    }
  }, []);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle master volume change
  const handleMasterVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume);
  }, [setMasterVolume]);

  // Handle track volume change
  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    audioEngine.setTrackVolume(trackId, volume);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume } : t))
    );
    setTrackVolumes((prev) => ({ ...prev, [trackId]: volume }));
  }, [setTrackVolumes]);

  // Handle scene change
  const handleSceneChange = useCallback((sceneId: string) => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    }
    setCurrentSceneId(sceneId);
  }, [isPlaying, setCurrentSceneId]);

  // Handle randomize
  const handleRandomize = useCallback(() => {
    tracks.forEach((track) => {
      const randomVolume = Math.random() * 0.6 + 0.1; // 10% to 70%
      handleTrackVolumeChange(track.id, randomVolume);
    });
  }, [tracks, handleTrackVolumeChange]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    if (masterVolume > 0) {
      setMasterVolume(0);
    } else {
      setMasterVolume(0.7);
    }
  }, [masterVolume, setMasterVolume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'KeyM':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'KeyR':
          e.preventDefault();
          handleRandomize();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleMuteToggle, handleRandomize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.dispose();
    };
  }, []);

  if (loadError) {
    return (
      <div className="error-screen">
        <h1>Failed to Load Configuration</h1>
        <p>{loadError}</p>
        <p>Please ensure /public/assets.json exists and is valid.</p>
      </div>
    );
  }

  if (!assets || !currentScene) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <VideoBackground background={currentScene.background} />

      {!isUnlocked && <UnlockOverlay onUnlock={handleUnlock} />}

      <ControlPanel
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolumeChange}
        tracks={tracks}
        onTrackVolumeChange={handleTrackVolumeChange}
        currentScene={currentScene}
        allScenes={assets.scenes}
        onSceneChange={handleSceneChange}
        onRandomize={handleRandomize}
      />
    </div>
  );
}

export default App;
