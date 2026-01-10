interface UnlockOverlayProps {
  onUnlock: () => void;
}

export function UnlockOverlay({ onUnlock }: UnlockOverlayProps) {
  return (
    <div className="unlock-overlay">
      <div className="unlock-overlay__content">
        <div className="unlock-overlay__icon">🎵</div>
        <h2 className="unlock-overlay__title">Tap to Start</h2>
        <p className="unlock-overlay__subtitle">Enable audio playback</p>
        <button className="unlock-overlay__button" onClick={onUnlock}>
          Start Noise Mixer
        </button>
      </div>
    </div>
  );
}
