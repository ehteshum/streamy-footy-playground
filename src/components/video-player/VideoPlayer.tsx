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
  // Add our own controls visibility state to override the one from useVideoPlayer
  const [localControlsVisible, setLocalControlsVisible] = useState(true);
  
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
    isControlsVisible: hookControlsVisible,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    toggleFullscreen,
    togglePictureInPicture,
    formatTime,
    handleUserInteraction: originalHandleUserInteraction
  } = useVideoPlayer(streamUrl);

  // Computed controls visibility based on both states
  const isControlsVisible = isFullscreen ? localControlsVisible : hookControlsVisible;

  // Custom user interaction handler
  const handleUserInteraction = () => {
    // Call the original handler from the hook
    originalHandleUserInteraction();
    
    // Also update our local state
    setLocalControlsVisible(true);
  };
  
  // Handle auto-hiding controls in fullscreen mode with a proper useEffect
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (isFullscreen && localControlsVisible) {
      // Set a timeout to hide controls
      timeoutId = window.setTimeout(() => {
        setLocalControlsVisible(false);
      }, 2000);
    }
    
    // Cleanup function
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isFullscreen, localControlsVisible]);
  
  // Effect to handle fullscreen changes
  useEffect(() => {
    // When fullscreen is toggled on, hide the controls immediately
    if (isFullscreen) {
      // Force hide controls when entering fullscreen
      setLocalControlsVisible(false);
    } else {
      // Show controls when exiting fullscreen
      setLocalControlsVisible(true);
    }
  }, [isFullscreen]);
  
  // Add listener for custom hidecontrols event
  useEffect(() => {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    const handleHideControls = () => {
      setLocalControlsVisible(false);
    };
    
    // Add event listener for our custom event
    container.addEventListener('hidecontrols', handleHideControls);
    
    // Cleanup
    return () => {
      container.removeEventListener('hidecontrols', handleHideControls);
    };
  }, []);
  
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

  // Custom fullscreen handler that ensures controls hide
  const handleFullscreenToggle = () => {
    toggleFullscreen();
    
    // If entering fullscreen, immediately hide controls
    if (!isFullscreen) {
      setLocalControlsVisible(false);
    }
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
      onMouseLeave={isFullscreen ? () => setLocalControlsVisible(false) : undefined}
      onTouchStart={handleUserInteraction}
      onTouchMove={handleUserInteraction}
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
      {!isPlaying && !isBuffering && !isError && isControlsVisible && (
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
          toggleFullscreen={handleFullscreenToggle}
          togglePictureInPicture={togglePictureInPicture}
          formatTime={formatTime}
        />
      </div>
      
      {/* Error Message */}
      {isError && <VideoError />}
      
      {/* Buffering indicator */}
      {isBuffering && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center z-30 bg-black/30",
          isFullscreen && !isControlsVisible ? "opacity-0" : "opacity-100"
        )}>
          <Spinner className="w-10 h-10" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
