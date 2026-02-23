import { useEffect, useRef, useState, useCallback } from 'react';

const PLAYER_DIV_ID = 'yt-player';

export function useYouTube() {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [volume, setVolumeState] = useState(70);

  // Load YT IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    window.onYouTubeIframeAPIReady = initPlayer;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  function initPlayer() {
    playerRef.current = new window.YT.Player(PLAYER_DIV_ID, {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          e.target.setVolume(70);
          setReady(true);
        },
        onStateChange: (e) => {
          const state = e.data;
          // 1 = playing, 2 = paused, 0 = ended
          if (state === window.YT.PlayerState.PLAYING) {
            setPlaying(true);
            try {
              const data = e.target.getVideoData();
              setCurrentVideo({ title: data.title, author: data.author });
            } catch (_) {}
          } else if (state === window.YT.PlayerState.PAUSED) {
            setPlaying(false);
          } else if (state === window.YT.PlayerState.ENDED) {
            // auto-advance: next in playlist handled by YT
          }
        },
      },
    });
  }

  const loadPlaylist = useCallback((playlistId) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.loadPlaylist({
        list: playlistId,
        listType: 'playlist',
        index: Math.floor(Math.random() * 20), // start at random track
        suggestedQuality: 'small',
      });
    } catch (e) {
      console.warn('YT loadPlaylist error', e);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {}
  }, []);

  const next = useCallback(() => {
    if (!playerRef.current) return;
    try { playerRef.current.nextVideo(); } catch (e) {}
  }, []);

  const prev = useCallback(() => {
    if (!playerRef.current) return;
    try { playerRef.current.previousVideo(); } catch (e) {}
  }, []);

  const changeVolume = useCallback((v) => {
    setVolumeState(v);
    if (!playerRef.current) return;
    try { playerRef.current.setVolume(v); } catch (e) {}
  }, []);

  return { ready, playing, currentVideo, volume, loadPlaylist, togglePlay, next, prev, changeVolume };
}
