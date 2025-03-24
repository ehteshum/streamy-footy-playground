import React, { useEffect, useState } from 'react';
import { useVideoPlayer } from './useVideoPlayer';
import VideoControls from './VideoControls';
import VideoError from './VideoError';
import VideoTitle from './VideoTitle';
import DiagnosticOverlay from './DiagnosticOverlay';
import { cn } from '@/lib/utils';
import BufferingIndicator from './BufferingIndicator';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPictureIcon,
  Settings
} from 'lucide-react';
import Spinner from '../Spinner';

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title, className }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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

  // Combine the controls visibility state from the hook with our local state
  const effectiveControlsVisible = isControlsVisible && localControlsVisible;

  // Effect to hide local controls in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      // Add a very short timeout to hide our local controls
      const timer = setTimeout(() => {
        setLocalControlsVisible(false);
      }, 1600);
      
      return () => clearTimeout(timer);
    } else {
      setLocalControlsVisible(true);
    }
  }, [isFullscreen]);

  // Handle direct video click to toggle controls in fullscreen
  const handleVideoAreaClick = (e: React.MouseEvent) => {
    // Only toggle controls if in fullscreen mode and no other interaction
    if (isFullscreen) {
      e.stopPropagation();
      setLocalControlsVisible(prev => !prev);
      handleUserInteraction(); // Make sure the main player also knows about the interaction
    } else {
      // In normal mode, just toggle play
      togglePlay();
    }
  };

  // Log when component gets destroyed - helps track potential memory leaks
  useEffect(() => {
    console.log('VideoPlayer mounted with stream:', streamUrl);
    return () => {
      console.log('VideoPlayer unmounted, cleaning up resources');
    };
  }, [streamUrl]);
  
  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle diagnostics with Alt+D
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
  
  // Single click handler for play/pause toggle
  const handleClick = () => {
    togglePlay();
  };

  // Adapters for VideoControls component to handle type differences
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
      onMouseLeave={() => handleUserInteraction()}
      onTouchStart={handleUserInteraction}
      onTouchEnd={handleUserInteraction}
      onTouchMove={handleUserInteraction}
    >
      {/* Video Element - Now with direct click handler for fullscreen */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={false}
        muted={isMuted}
        preload="auto"
        crossOrigin="anonymous"
        onClick={handleVideoAreaClick}
        onDoubleClick={handleDoubleClick}
        x-webkit-airplay="allow"
        x-webkit-playsinline="true"
        controlsList="nodownload"
      >
        {/* HLS.js handles the source */}
        Your browser does not support the video tag.
      </video>
      
      {/* Diagnostic Overlay */}
      <DiagnosticOverlay 
        videoRef={videoRef} 
        isEnabled={showDiagnostics}
        playerType={'hls'}
      />
      
      {/* Help text (visible when diagnostics are enabled) */}
      {showDiagnostics && (
        <div className="fixed bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded z-50">
          <div>Alt+D: Toggle diagnostics</div>
        </div>
      )}
      
      {/* Play button overlay when paused */}
      {!isPlaying && !isBuffering && !isError && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-20" onClick={togglePlay}>
          <div className="bg-black/50 rounded-full p-4">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Controls Overlay - Updated with combined visibility state */}
      <div 
        className={cn(
          "controls-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300",
          isFullscreen ? "z-40" : "",
          effectiveControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top Bar with Title */}
        <VideoTitle title={title} />
        
        {/* Center Play/Pause Button */}
        {!isError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {/* Don't show anything here */}
          </div>
        )}
        
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
      
      {/* Buffering indicator - improved to be less flickery */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/40">
          <Spinner className="w-10 h-10" />
          <div className="mt-4 text-white text-sm font-medium">
            Buffering...
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
