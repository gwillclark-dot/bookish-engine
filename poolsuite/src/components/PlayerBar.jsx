export function PlayerBar({ channel, playing, volume, onToggle, onNext, onPrev, onVolume }) {
  return (
    <div className="ps-player">
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">POOLSUITE FM</div>
          <div className="title-bar-controls">
            <button aria-label="Help" />
          </div>
        </div>
        <div className="window-body">

          <div className="ps-logo">⛱ PS.FM</div>

          <div className="player-controls">
            <button title="Previous" onClick={onPrev}>⏮</button>
            <button title={playing ? 'Pause' : 'Play'} onClick={onToggle}>
              {playing ? '⏸' : '▶'}
            </button>
            <button title="Next" onClick={onNext}>⏭</button>
          </div>

          <div className="player-track-info">
            <div className="player-track-name">
              {channel ? `${channel.emoji}  ${channel.name}` : 'SELECT A CHANNEL'}
            </div>
            <div className="player-track-sub">
              {channel ? channel.vibe : 'TUNE IN TO BEGIN'}
            </div>
          </div>

          <div className="player-volume">
            <span>🔈</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
            />
            <span>🔊</span>
          </div>

          <div className={`status-light ${playing ? 'playing' : ''}`} title={playing ? 'ON AIR' : 'STANDBY'} />

        </div>
      </div>
    </div>
  );
}
