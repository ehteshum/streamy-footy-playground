<<<<<<< HEAD

import React from 'react';
import { useVideoPlayer } from './useVideoPlayer';
import VideoControls from './VideoControls';
import VideoError from './VideoError';
import BufferingIndicator from './BufferingIndicator';
import VideoTitle from './VideoTitle';
=======
import React, { useEffect, useState } from 'react';
import { useVideoPlayer } from './useVideoPlayer';
import VideoControls from './VideoControls';
import VideoError from './VideoError';
import VideoTitle from './VideoTitle';
import DiagnosticOverlay from './DiagnosticOverlay';
import { cn } from '@/lib/utils';
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
>>>>>>> 36583a8 (Initial commit)

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
<<<<<<< HEAD
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title }) => {
  const {
    videoRef,
=======
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title, className }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [forcePlayerType, setForcePlayerType] = useState<'hls' | 'dash' | 'native' | null>(null);
  
  const {
    videoRef,
    hlsRef,
>>>>>>> 36583a8 (Initial commit)
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
<<<<<<< HEAD
    handleUserInteraction
  } = useVideoPlayer(streamUrl);
=======
    handleUserInteraction,
    playerType
  } = useVideoPlayer(streamUrl, forcePlayerType);

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
      
      // Force player type with Alt+1/2/3
      if (e.altKey) {
        if (e.key === '1') {
          console.log('Forcing HLS player');
          setForcePlayerType('hls');
        } else if (e.key === '2') {
          console.log('Forcing DASH player');
          setForcePlayerType('dash');
        } else if (e.key === '3') {
          console.log('Forcing native player');
          setForcePlayerType('native');
        } else if (e.key === '0') {
          console.log('Resetting player type');
          setForcePlayerType(null);
        }
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
>>>>>>> 36583a8 (Initial commit)

  return (
    <div 
      id="video-container"
<<<<<<< HEAD
      className="video-container relative w-full h-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg"
      onMouseMove={handleUserInteraction}
    >
      {/* Video Element */}
=======
      className={cn(
        "relative w-full h-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg",
        className
      )}
      onMouseMove={handleUserInteraction}
      onMouseLeave={() => handleUserInteraction()}
      onTouchStart={handleUserInteraction}
    >
      {/* Video Element - Optimized for maximum stability */}
>>>>>>> 36583a8 (Initial commit)
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
<<<<<<< HEAD
      >
        <source src={streamUrl} type="application/x-mpegURL" />
        Your browser does not support the video tag.
      </video>
      
=======
        autoPlay={false}
        muted={isMuted}
        preload="auto"
        crossOrigin="anonymous"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        x-webkit-airplay="allow"
        x-webkit-playsinline="true"
        disablePictureInPicture={false}
        disableRemotePlayback={false}
        controlsList="nodownload"
      >
        {/* HLS.js handles the source */}
        Your browser does not support the video tag.
      </video>
      
      {/* Diagnostic Overlay */}
      <DiagnosticOverlay 
        videoRef={videoRef} 
        isEnabled={showDiagnostics}
        playerType={playerType}
      />
      
      {/* Help text (visible when diagnostics are enabled) */}
      {showDiagnostics && (
        <div className="fixed bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded z-50">
          <div>Alt+D: Toggle diagnostics</div>
          <div>Alt+1: Force HLS player</div>
          <div>Alt+2: Force DASH player</div>
          <div>Alt+3: Force native player</div>
          <div>Alt+0: Auto-select player</div>
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
      
>>>>>>> 36583a8 (Initial commit)
      {/* Controls Overlay */}
      <div 
        className={`controls-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top Bar with Title */}
        <VideoTitle title={title} />
        
<<<<<<< HEAD
        {/* Center Play/Pause Button */}
        {!isError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {isBuffering && !isError && <BufferingIndicator />}
=======
        {/* Center Play/Pause Button - Removing the BufferingIndicator */}
        {!isError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {/* Removed duplicated buffering indicator */}
>>>>>>> 36583a8 (Initial commit)
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
          handleVolumeChange={handleVolumeChange}
          handleSeek={handleSeek}
          toggleFullscreen={toggleFullscreen}
          togglePictureInPicture={togglePictureInPicture}
          formatTime={formatTime}
        />
      </div>
      
      {/* Error Message */}
      {isError && <VideoError />}
<<<<<<< HEAD
=======
      
      {/* Minimalist buffering indicator - only shows when absolutely necessary */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="p-4 rounded-lg bg-black/40 text-white flex flex-col items-center">
            <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-white transition-all duration-300" 
                style={{ 
                  width: '100%',
                  animation: 'flow 1.5s infinite linear'
                }}
              />
            </div>
            <style>
              {`
                @keyframes flow {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}
            </style>
          </div>
        </div>
      )}
>>>>>>> 36583a8 (Initial commit)
    </div>
  );
};

export default VideoPlayer;
