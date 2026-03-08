import { useState, useEffect } from 'react';
import { ChannelSidebar } from './components/ChannelSidebar';
import { NowPlaying } from './components/NowPlaying';
import { PlayerBar } from './components/PlayerBar';
import { useYouTube } from './useYouTube';
import { CHANNELS } from './channels';

function App() {
  const [activeChannel, setActiveChannel] = useState(null);
  const { ready, playing, currentVideo, volume, loadPlaylist, togglePlay, next, prev, changeVolume } = useYouTube();

  const handleSelectChannel = (channel) => {
    setActiveChannel(channel);
    if (ready) {
      loadPlaylist(channel.playlistId);
    }
  };

  // If player becomes ready while a channel is already selected, load it
  useEffect(() => {
    if (ready && activeChannel) {
      loadPlaylist(activeChannel.playlistId);
    }
  }, [ready]);

  // Auto-select first channel on mount
  useEffect(() => {
    if (ready && !activeChannel) {
      handleSelectChannel(CHANNELS[0]);
    }
  }, [ready]);

  return (
    <>
      {/* Hidden YT player target */}
      <div id="yt-player" />

      <div className="ps-desktop">
        <ChannelSidebar activeId={activeChannel?.id} onSelect={handleSelectChannel} />

        <div className="ps-main">
          <div className="ds-panel">
            <div className="ds-panel-header">
              {activeChannel
                ? `${activeChannel.name} — ${activeChannel.vibe}`
                : 'NOW PLAYING'}
            </div>
            <div className="ds-panel-body">
              <NowPlaying
                channel={activeChannel}
                currentVideo={currentVideo}
                playing={playing}
              />
            </div>
          </div>
        </div>

        <PlayerBar
          channel={activeChannel}
          playing={playing}
          volume={volume}
          onToggle={togglePlay}
          onNext={next}
          onPrev={prev}
          onVolume={changeVolume}
        />
      </div>
    </>
  );
}

export default App;
