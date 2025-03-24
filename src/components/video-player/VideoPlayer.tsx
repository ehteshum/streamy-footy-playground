import React, { useEffect, useState } from 'react';
import { useVideoPlayer } from './useVideoPlayer';
import VideoControls from './VideoControls';
import VideoError from './VideoError';
import VideoTitle from './VideoTitle';
import DiagnosticOverlay from './DiagnosticOverlay';
import { cn } from '@/lib/utils';
import Spinner from '../Spinner';

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title, className }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const {
    videoRef,
    isPlaying,
    isFullscreen,
    isPiP,
    isMuted,
    volume,
    currentTime,
    duration,
    isBuffering,
    isError,
    isControlsVisible,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    toggleFullscreen,
    togglePictureInPicture,
    formatTime,
    handleUserInteraction
  } = useVideoPlayer(streamUrl);

  // Add keyboard shortcut for diagnostics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setShowDiagnostics(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Double click handler for fullscreen toggle
  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  // Adapters for VideoControls component
  const handleVolumeChangeAdapter = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleVolumeChange(parseFloat(e.target.value));
  };

  const handleSeekAdapter = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSeek(parseFloat(e.target.value));
  };

  return (
    <div 
      id="video-container"
      className={cn(
        "relative w-full h-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg",
        isFullscreen ? "fixed inset-0 z-50" : "",
        className
      )}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={false}
        muted={isMuted}
        preload="auto"
        crossOrigin="anonymous"
        onClick={togglePlay}
        onDoubleClick={handleDoubleClick}
        controls={false}
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Diagnostic Overlay */}
      {showDiagnostics && (
        <DiagnosticOverlay 
          videoRef={videoRef} 
          isEnabled={true}
          playerType={'hls'}
        />
      )}
      
      {/* Play button overlay when paused */}
      {!isPlaying && !isBuffering && !isError && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20" 
          onClick={togglePlay}
        >
          <div className="bg-black/50 rounded-full p-4">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300",
          isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Title */}
        <VideoTitle title={title} />
        
        {/* Video Controls */}
        <VideoControls 
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          isFullscreen={isFullscreen}
          isPiP={isPiP}
          togglePlay={togglePlay}
          toggleMute={toggleMute}
          handleVolumeChange={handleVolumeChangeAdapter}
          handleSeek={handleSeekAdapter}
          toggleFullscreen={toggleFullscreen}
          togglePictureInPicture={togglePictureInPicture}
          formatTime={formatTime}
        />
      </div>
      
      {/* Error Message */}
      {isError && <VideoError />}
      
      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/30">
          <Spinner className="w-10 h-10" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
