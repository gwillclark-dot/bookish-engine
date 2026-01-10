import { useEffect, useRef, useState } from 'react';
import type { Background } from '../types/assets';
import { getBestVideoSource } from '../config/loadAssets';

interface VideoBackgroundProps {
  background: Background;
}

export function VideoBackground({ background }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    const bestSource = getBestVideoSource(background.sources);
    setVideoSrc(bestSource);
    setHasError(false);
  }, [background]);

  const handleError = () => {
    console.warn('Video failed to load, using fallback gradient');
    setHasError(true);
  };

  const handleLoadedData = () => {
    // Ensure video plays smoothly
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay blocked:', err);
      });
    }
  };

  return (
    <div className="video-background">
      {!hasError && videoSrc ? (
        <>
          <video
            ref={videoRef}
            className="video-background__video"
            poster={background.poster}
            autoPlay
            loop
            muted
            playsInline
            onError={handleError}
            onLoadedData={handleLoadedData}
          >
            <source src={videoSrc} type={background.sources.find(s => s.src === videoSrc)?.type} />
          </video>
          <div className="video-background__overlay" />
        </>
      ) : (
        <div className="video-background__fallback" />
      )}
    </div>
  );
}
