
import React from 'react';
import { useVideoPlayer } from './useVideoPlayer';
import VideoControls from './VideoControls';
import VideoError from './VideoError';
import BufferingIndicator from './BufferingIndicator';
import VideoTitle from './VideoTitle';

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title }) => {
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

  return (
    <div 
      id="video-container"
      className="video-container relative w-full h-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg"
      onMouseMove={handleUserInteraction}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      >
        <source src={streamUrl} type="application/x-mpegURL" />
        Your browser does not support the video tag.
      </video>
      
      {/* Controls Overlay */}
      <div 
        className={`controls-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top Bar with Title */}
        <VideoTitle title={title} />
        
        {/* Center Play/Pause Button */}
        {!isError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {isBuffering && !isError && <BufferingIndicator />}
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
    </div>
  );
};

export default VideoPlayer;
