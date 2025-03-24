import { useState, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import Hls from 'hls.js';

// Revised HLS.js config - FIXED FOR IMMEDIATE PLAYBACK
const HLS_CONFIG = {
  // Core settings
  debug: false,
  enableWorker: true,
  lowLatencyMode: false,
  
  // Buffer settings - balanced approach
  maxBufferLength: 60,              // Reduced from 120s to 60s for faster start
  maxMaxBufferLength: 180,          // Reduced from 300s to 180s
  liveSyncDuration: 3,
  
  // Initial loading strategy - CRITICAL FIX
  startFragPrefetch: true,
  autoStartLoad: true,              // Changed back to true to ensure loading starts immediately
  manifestLoadingTimeOut: 20000,
  manifestLoadingMaxRetry: 4,
  manifestLoadingRetryDelay: 1000,
  
  // Bandwidth detection settings
  abrEwmaDefaultEstimate: 1000000,
  abrBandWidthFactor: 0.8,
  
  // Quality settings
  capLevelToPlayerSize: true,
  startLevel: 0,                    // Always start at lowest quality for faster initial load
  
  // Recovery settings
  fragLoadingMaxRetry: 8,
  levelLoadingMaxRetry: 4,
  
  // Buffer management settings
  maxStarvationDelay: 4,
  maxLoadingDelay: 4,
  maxFragLookUpTolerance: 0.25,
  
  // Fragment loading behavior
  fragLoadingRetryDelay: 1000,
  
  // XHR settings
  xhrSetup: function(xhr: XMLHttpRequest) {
    xhr.timeout = 30000;
  }
};

export const useVideoPlayer = (streamUrl: string) => {
  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const bufferCheckIntervalRef = useRef<number | null>(null);
  const bufferUITimerRef = useRef<number | null>(null);
  const initialBufferingRef = useRef<boolean>(true);
  const playbackAttemptRef = useRef<number>(0);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true); // Start with buffering state
  const [isError, setIsError] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Function to delay showing buffering UI to avoid flickering
  const showBufferingWithDelay = (show: boolean) => {
    if (bufferUITimerRef.current) {
      window.clearTimeout(bufferUITimerRef.current);
      bufferUITimerRef.current = null;
    }
    
    if (show) {
      // Only show buffering UI after a delay to avoid flickering
      // Use shorter delay for initial buffering
      const delay = initialBufferingRef.current ? 200 : 1000;
      bufferUITimerRef.current = window.setTimeout(() => {
        setIsBuffering(true);
      }, delay);
    } else {
      // Mark initial buffering as complete once we hide buffering UI
      initialBufferingRef.current = false;
      // Hide immediately
      setIsBuffering(false);
    }
  };

  // Function to check buffer level
  const checkBufferLevel = () => {
    const video = videoRef.current;
    if (!video) return 0;
    
    // Calculate current buffer
    let currentBuffer = 0;
    if (video.buffered.length > 0) {
      const buffered = video.buffered;
      const currentTime = video.currentTime;
      
      for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
          currentBuffer = buffered.end(i) - currentTime;
          break;
        }
      }
    }
    
    return currentBuffer;
  };

  // Function to check if we've buffered enough to start playback
  const hasBufferedEnoughToPlay = () => {
    const bufferLevel = checkBufferLevel();
    // IMPORTANT FIX: Reduced buffer requirements
    const requiredBuffer = initialBufferingRef.current ?
      3 : // Only require 3 seconds for initial playback (down from 8)
      0.5; // Still only 0.5 seconds for continued playback
    
    return bufferLevel >= requiredBuffer;
  };

  // Function to attempt playback when buffered enough
  const attemptPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // IMPORTANT FIX: Remove the check for hasBufferedEnoughToPlay() to ensure playback starts
    playbackAttemptRef.current += 1;
    console.log(`Attempt ${playbackAttemptRef.current}: Starting playback with ${checkBufferLevel().toFixed(1)}s buffer`);
    
    video.play().then(() => {
      setIsPlaying(true);
      showBufferingWithDelay(false);
    }).catch((error) => {
      console.error('Error playing video:', error);
      // If autoplay fails, we'll need user interaction
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    
    // Show buffering indicator immediately for initial load
    showBufferingWithDelay(true);
    
    // Create HLS instance if browser supports it
    if (Hls.isSupported()) {
      // Create new HLS instance
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;
      
      // Load source and attach to video
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      // Event listeners
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS media attached');
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        
        // Force lowest quality for initial load
        hls.startLevel = 0;
        
        // IMPORTANT FIX: Set a very short timeout to attempt playback immediately
        setTimeout(() => {
          if (initialBufferingRef.current) {
            console.log('Attempting immediate playback');
            attemptPlayback();
          }
        }, 1000); // Try to play after just 1 second
        
        // IMPORTANT FIX: Also set a safety timeout to ensure playback happens
        setTimeout(() => {
          if (!isPlaying && initialBufferingRef.current) {
            console.log('Emergency playback after 4s timeout');
            attemptPlayback();
          }
        }, 4000); // Emergency playback after 4 seconds
      });
      
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log(`Quality level switched to ${data.level}`);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error:', data);
              // Try to recover
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error:', data);
              // Try to recover
              hls.recoverMediaError();
              break;
            default:
              // Fatal error, try to destroy and recreate
              hls.destroy();
              setIsError(true);
              break;
          }
        }
      });
      
      // Set up buffer check interval - OPTIMIZED
      bufferCheckIntervalRef.current = window.setInterval(() => {
        if (!video.paused) {
          const bufferLevel = checkBufferLevel();
          
          // Only show buffering UI if buffer is critically low and we're playing
          if (bufferLevel < 0.5 && isPlaying) {
            showBufferingWithDelay(true);
          } else if (bufferLevel >= 2.0) {
            showBufferingWithDelay(false);
          }
          
          // Log buffer every 5 seconds for debugging
          if (Math.floor(video.currentTime) % 5 === 0 && Math.floor(video.currentTime) > 0) {
            console.log(`Buffer level: ${bufferLevel.toFixed(2)}s`);
          }
        }
      }, 1000);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For browsers that support HLS natively (Safari)
      video.src = streamUrl;
      
      video.addEventListener('loadedmetadata', () => {
        // For Safari, we need to wait for more data before playing
        video.addEventListener('canplay', () => {
          if (initialBufferingRef.current) {
            attemptPlayback();
          }
        }, { once: true });
      });
    }
    
    // Event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    const handleDurationChange = () => {
      setDuration(video.duration);
    };
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleWaiting = () => {
      // Only show buffering if we have less than 1 second of buffer
      if (checkBufferLevel() < 1) {
        showBufferingWithDelay(true);
      }
    };
    const handlePlaying = () => {
      showBufferingWithDelay(false);
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    
    // Clean up
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      
      if (bufferCheckIntervalRef.current) {
        window.clearInterval(bufferCheckIntervalRef.current);
        bufferCheckIntervalRef.current = null;
      }
      
      if (bufferUITimerRef.current) {
        window.clearTimeout(bufferUITimerRef.current);
        bufferUITimerRef.current = null;
      }
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, isPlaying]);

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
        
        // Immediately start the hide timer
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
        }
        
        // Brief flash of controls then hide
        setIsControlsVisible(true);
        
        controlsTimerRef.current = window.setTimeout(() => {
          setIsControlsVisible(false);
        }, 1500);
        
      }).catch((error) => {
        console.error('Error attempting to enable fullscreen:', error);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setIsControlsVisible(true); // Always show controls when exiting
      }).catch((error) => {
        console.error('Error attempting to exit fullscreen:', error);
      });
    }
  };

  // Toggle picture in picture
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
      console.error('Error toggling picture in picture:', error);
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
    // Show controls when user interacts
    setIsControlsVisible(true);
    setIsUserInteracting(true);
    
    // Clear existing timer
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
    
    // Set very short timeout in fullscreen mode
    const hideDelay = isFullscreen ? 1500 : 3000; // Even shorter delay in fullscreen
    
    controlsTimerRef.current = window.setTimeout(() => {
      // Force hide controls in fullscreen mode
      if (isFullscreen) {
        setIsControlsVisible(false);
      } else if (!isUserInteracting) {
        setIsControlsVisible(false);
      }
      setIsUserInteracting(false);
    }, hideDelay);
  };

  // Add this effect to monitor fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocumentFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isDocumentFullscreen);
      
      // When entering fullscreen, start a timer to hide controls
      if (isDocumentFullscreen) {
        // Hide controls after a short delay
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
        }
        
        setIsControlsVisible(true); // Show initially
        
        controlsTimerRef.current = window.setTimeout(() => {
          setIsControlsVisible(false);
        }, 1500);
      } else {
        // When exiting fullscreen, always show controls
        setIsControlsVisible(true);
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
