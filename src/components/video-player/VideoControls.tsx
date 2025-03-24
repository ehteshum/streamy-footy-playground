import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  isPiP: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleFullscreen: () => void;
  togglePictureInPicture: () => void;
  formatTime: (time: number) => string;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  isFullscreen,
  isPiP,
  togglePlay,
  toggleMute,
  handleVolumeChange,
  handleSeek,
  toggleFullscreen,
  togglePictureInPicture,
  formatTime
}) => {
  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2 z-10",
      isFullscreen ? "pb-6" : "" // Add more padding at bottom in fullscreen mode
    )}>
      {/* Progress Bar */}
      <div className="w-full flex items-center gap-2">
        <span className="text-white text-xs">{formatTime(currentTime)}</span>
        <div className="relative flex-1 h-2 group">
          <input
            type="range"
            min="0"
            max={isFinite(duration) ? duration : 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className={cn(
              "absolute inset-0 w-full h-2 appearance-none cursor-pointer opacity-0 z-10",
              isFullscreen ? "h-4 -my-1" : "h-2" // Larger touch target in fullscreen
            )}
          />
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden group-hover:h-2 transition-all duration-200">
            <div 
              className="h-full bg-white rounded-full"
              style={{
                width: `${(currentTime / (duration || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
        <span className="text-white text-xs">{formatTime(duration)}</span>
      </div>
      
      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-white hover:bg-white/10 rounded-full",
              isFullscreen ? "p-2" : "p-1" // Larger button in fullscreen
            )}
            onClick={togglePlay}
          >
            <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "28" : "24"} height={isFullscreen ? "28" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "28" : "24"} height={isFullscreen ? "28" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </Button>
          
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "text-white hover:bg-white/10 rounded-full",
                isFullscreen ? "p-2" : "p-1" // Larger button in fullscreen
              )}
              onClick={toggleMute}
            >
              <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "24" : "20"} height={isFullscreen ? "24" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "24" : "20"} height={isFullscreen ? "24" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "24" : "20"} height={isFullscreen ? "24" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </Button>
            
            <div className="relative h-2 group">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={cn(
                  "absolute inset-0 w-full appearance-none cursor-pointer opacity-0 z-10",
                  isFullscreen ? "h-4 -my-1" : "h-2" // Larger touch target in fullscreen
                )}
              />
              <div className={cn(
                "bg-white/30 rounded-full overflow-hidden transition-all duration-200",
                isFullscreen ? "w-28 h-2" : "w-16 md:w-24 h-1"
              )}>
                <div 
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${(isMuted ? 0 : volume) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Picture-in-Picture Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-white hover:bg-white/10 rounded-full hidden sm:flex",
              isFullscreen ? "p-2" : "p-1" // Larger button in fullscreen
            )}
            onClick={togglePictureInPicture}
          >
            <span className="sr-only">{isPiP ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "22" : "18"} height={isFullscreen ? "22" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <rect x="12" y="8" width="8" height="7" rx="1" />
            </svg>
          </Button>
          
          {/* Fullscreen Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-white hover:bg-white/10 rounded-full",
              isFullscreen ? "p-2" : "p-1" // Larger button in fullscreen
            )}
            onClick={toggleFullscreen}
          >
            <span className="sr-only">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "22" : "18"} height={isFullscreen ? "22" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={isFullscreen ? "22" : "18"} height={isFullscreen ? "22" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
