import { useState, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import Hls from 'hls.js';

// Very minimal config to ensure playback works
const HLS_CONFIG = {
  autoStartLoad: true,
  startLevel: 0,
  debug: false,
  capLevelToPlayerSize: true,
  maxBufferLength: 30
};

export const useVideoPlayer = (streamUrl: string) => {
  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    
    // Create HLS instance if browser supports it
    if (Hls.isSupported()) {
      console.log('Using HLS.js to play video');
      
      // Clean up any existing instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      // Create new instance
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;
      
      // Basic error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad(); // Try to recover
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError(); // Try to recover
              break;
            default:
              setIsError(true); // Can't recover
              break;
          }
        }
      });
      
      // Set up video
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      // Try to play as soon as possible
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('Manifest parsed, attempting to play');
        video.play().catch(error => {
          console.error('Error playing video:', error);
          // Most browsers require user interaction for autoplay
        });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari which has native HLS support
      console.log('Using native HLS support');
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(error => {
          console.error('Error playing video:', error);
        });
      });
    } else {
      console.error('HLS is not supported by your browser');
      setIsError(true);
    }
    
    // Event listeners for state changes
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    
    // Add event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    
    // Clean up
    return () => {
      // Remove event listeners
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      
      // Clean up HLS
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      // Clear timers
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
    };
  }, [streamUrl]);

  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
  };

  // Handle volume change
  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = value;
  };

  // Handle seeking
  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = value;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        
        // Hide controls immediately when entering fullscreen
        setIsControlsVisible(false);
        
        // Clear any existing timer
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
          controlsTimerRef.current = null;
        }
      }).catch((error) => {
        console.error('Error entering fullscreen:', error);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setIsControlsVisible(true);
        
        // Clear any existing timers
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
          controlsTimerRef.current = null;
        }
      }).catch((error) => {
        console.error('Error exiting fullscreen:', error);
      });
    }
  };

  // Toggle picture-in-picture
  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.error('Error toggling picture-in-picture:', error);
    }
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle user interaction for controls
  const handleUserInteraction = () => {
    setIsControlsVisible(true);
    setIsUserInteracting(true);
    
    // Clear any existing timer
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
    }
    
    // Set a new timer to hide controls
    controlsTimerRef.current = window.setTimeout(() => {
      // Only hide controls in fullscreen mode if user is not interacting
      if (isFullscreen && !isUserInteracting) {
        setIsControlsVisible(false);
      }
      setIsUserInteracting(false);
    }, isFullscreen ? 2000 : 5000); // Shortened delay for fullscreen mode
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isInFullscreen);
      
      // If exiting fullscreen, ensure controls are visible
      if (!isInFullscreen) {
        setIsControlsVisible(true);
        
        // Clear any existing hide timer
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
          controlsTimerRef.current = null;
        }
      } else {
        // Hide controls immediately when entering fullscreen
        setIsControlsVisible(false);
        
        // Clear any existing timer
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
          controlsTimerRef.current = null;
        }
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
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
  };
};
