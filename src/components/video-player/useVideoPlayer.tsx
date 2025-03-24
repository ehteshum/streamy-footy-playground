import { useState, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import Hls from 'hls.js';

// Improved HLS.js config - focused on initial buffer and smooth startup
const HLS_CONFIG = {
  // Core settings
  debug: false,                     // Disable debug for production
  enableWorker: true,               // Use web workers for better performance
  lowLatencyMode: false,            // Disable low latency mode for stability
  
  // Buffer settings - GREATLY INCREASED for initial load
  maxBufferLength: 120,             // Massive increase to 120s buffer length
  maxMaxBufferLength: 300,          // Allow up to 5 minutes of buffer in good conditions
  liveSyncDuration: 3,              // Only necessary for live streams
  
  // Initial loading strategy - OPTIMIZED FOR FASTER START
  startFragPrefetch: true,          // Prefetch initial fragments for faster start
  autoStartLoad: false,             // We'll manually control loading for better startup
  manifestLoadingTimeOut: 20000,    // 20s timeout for manifest loading
  manifestLoadingMaxRetry: 4,       // Reasonable retries for manifest loading
  manifestLoadingRetryDelay: 1000,  // 1s delay between manifest retries
  
  // Bandwidth detection settings - CONSERVATIVE FOR FIRST LOAD
  abrEwmaDefaultEstimate: 1000000,  // Start with 1Mbps estimate
  abrBandWidthFactor: 0.8,          // Use 80% of detected bandwidth (more reasonable)
  
  // Quality settings
  capLevelToPlayerSize: true,       // Limit quality based on player size
  startLevel: 0,                    // Start at lowest quality for faster initial load
  
  // Recovery settings - more aggressive
  fragLoadingMaxRetry: 10,          // More retries for fragments
  levelLoadingMaxRetry: 8,          // More retries for levels
  
  // Critical buffer management settings
  maxStarvationDelay: 4,            // More balanced starvation delay
  maxLoadingDelay: 4,               // More reasonable loading delay
  maxFragLookUpTolerance: 0.25,     // More precise fragment lookup  
  
  // Fragment loading behavior
  fragLoadingRetryDelay: 500,       // 500ms between retries (faster for initial load)
  
  // XHR settings with increased timeout
  xhrSetup: function(xhr: XMLHttpRequest) {
    xhr.timeout = 30000;            // 30 seconds timeout
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
    // During initial load, require more buffer to ensure smooth playback
    const requiredBuffer = initialBufferingRef.current ?
      8 : // Require 8 seconds for initial playback
      0.5; // But only 0.5 seconds for continued playback
    
    return bufferLevel >= requiredBuffer;
  };

  // Function to attempt playback when buffered enough
  const attemptPlayback = () => {
    const video = videoRef.current;
    if (!video || isPlaying || !hasBufferedEnoughToPlay()) return;
    
    playbackAttemptRef.current += 1;
    console.log(`Attempt ${playbackAttemptRef.current}: Starting playback with ${checkBufferLevel().toFixed(1)}s buffer`);
    
    video.play().then(() => {
      setIsPlaying(true);
      showBufferingWithDelay(false);
    }).catch((error) => {
      console.error('Error playing video:', error);
      // If autoplay fails, we'll wait for user interaction
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
        
        // Start loading manually for better control
        hls.loadSource(streamUrl);
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        
        // Force lowest quality for initial load for faster startup
        hls.startLevel = 0;
        hls.currentLevel = 0;
        
        // Manually start loading
        hls.startLoad(-1); // Start loading from the beginning
        
        // Set up aggressive buffer checking for initial load
        const checkInitialBuffer = () => {
          const bufferLevel = checkBufferLevel();
          console.log(`Initial buffer: ${bufferLevel.toFixed(1)}s`);
          
          // Once we have enough buffer, start playback
          if (bufferLevel >= 8) {
            // We have enough buffer, start playback
            attemptPlayback();
            return true; // Signal to stop checking
          }
          
          return false; // Continue checking
        };
        
        // Check buffer aggressively at first
        const initialBufferCheckInterval = setInterval(() => {
          if (checkInitialBuffer()) {
            clearInterval(initialBufferCheckInterval);
          }
        }, 500); // Check every 500ms
        
        // Safety timeout to start playback even with less buffer
        setTimeout(() => {
          clearInterval(initialBufferCheckInterval);
          
          if (!isPlaying && initialBufferingRef.current) {
            console.log('Starting playback after timeout with buffer:', checkBufferLevel());
            attemptPlayback();
          }
        }, 8000); // Wait max 8 seconds before starting anyway
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
