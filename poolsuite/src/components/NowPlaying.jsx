export function NowPlaying({ channel, currentVideo, playing }) {
  if (!channel) {
    return (
      <div className="now-playing-screen">
        <div className="now-playing-emoji">🌴</div>
        <div className="now-playing-track">SELECT A CHANNEL</div>
        <div className="now-playing-artist">CHOOSE YOUR VIBE</div>
      </div>
    );
  }

  return (
    <div className="now-playing-screen">
      <div className="now-playing-channel">NOW PLAYING ·· {channel.name}</div>
      <div className="now-playing-emoji">{channel.emoji}</div>
      <div className="now-playing-track">
        {currentVideo?.title || channel.vibe.toUpperCase()}
      </div>
      <div className="now-playing-artist">
        {currentVideo?.author || '···'}
      </div>
      {playing && (
        <div className="visualizer">
          {[18, 28, 12, 24, 8, 20, 14, 26].map((h, i) => (
            <div
              key={i}
              className="visualizer-bar"
              style={{ height: `${h}px`, animationDuration: `${0.6 + i * 0.07}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
