import { useState, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import Hls from 'hls.js';

// Improved HLS.js config - focused on maximizing buffer for smooth playback
const HLS_CONFIG = {
  // Core settings
  debug: false,                     // Disable debug for production
  enableWorker: true,               // Use web workers for better performance
  lowLatencyMode: false,            // Disable low latency mode for stability
  
  // Buffer settings - GREATLY INCREASED
  maxBufferLength: 90,              // Massive increase to 90s buffer length
  maxMaxBufferLength: 180,          // Allow up to 3 minutes of buffer in good conditions
  liveSyncDuration: 3,              // Only necessary for live streams
  
  // Initial loading behavior
  startFragPrefetch: true,          // Prefetch initial fragments
  autoStartLoad: true,              // Start loading automatically
  manifestLoadingTimeOut: 20000,    // 20s timeout for manifest loading
  manifestLoadingMaxRetry: 4,       // Reasonable retries for manifest loading
  manifestLoadingRetryDelay: 1000,  // 1s delay between manifest retries
  
  // Bandwidth detection settings - MORE CONSERVATIVE
  abrEwmaDefaultEstimate: 1000000,  // Start with 1Mbps estimate
  abrBandWidthFactor: 0.75,         // Use 75% of detected bandwidth
  
  // Quality settings
  capLevelToPlayerSize: true,       // Limit quality based on player size
  startLevel: 0,                    // Always start at lowest quality (more reliable)
  
  // Recovery settings - more balanced
  fragLoadingMaxRetry: 8,           // More retries for fragments
  levelLoadingMaxRetry: 4,          // Reasonable retries for levels
  
  // Critical buffer management settings
  maxStarvationDelay: 4,            // More balanced starvation delay
  maxLoadingDelay: 4,               // More reasonable loading delay
  maxFragLookUpTolerance: 0.25,     // More precise fragment lookup  
  
  // Fragment loading behavior
  fragLoadingRetryDelay: 1000,      // 1s between retries
  
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
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
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
      // Only show buffering UI after a 1000ms delay to avoid flickering
      bufferUITimerRef.current = window.setTimeout(() => {
        setIsBuffering(true);
      }, 1000);
    } else {
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    
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
        
        // Start loading
        hls.loadSource(streamUrl);
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        
        // Force lowest quality for initial load
        hls.startLevel = 0;
        
        // Attempt to play
        video.play().then(() => {
          setIsPlaying(true);
          showBufferingWithDelay(false);
        }).catch((error) => {
          console.error('Error playing video:', error);
          // User may need to interact first
        });
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
          if (Math.floor(video.currentTime) % 5 === 0) {
            console.log(`Buffer level: ${bufferLevel.toFixed(2)}s`);
          }
        }
      }, 1000);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For browsers that support HLS natively (Safari)
      video.src = streamUrl;
      
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Error playing video:', error);
        });
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
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        
        // Hide controls after a short delay when entering fullscreen
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
        }
        controlsTimerRef.current = window.setTimeout(() => {
          setIsControlsVisible(false);
        }, 1500);
        
      }).catch((error) => {
        console.error('Error attempting to enable fullscreen:', error);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        
        // Always show controls when exiting fullscreen
        setIsControlsVisible(true);
        
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
    setIsControlsVisible(true);
    setIsUserInteracting(true);
    
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
    
    // Hide controls after a delay, using a shorter delay in fullscreen mode
    const hideDelay = isFullscreen ? 2000 : 3000; // Shorter delay in fullscreen for better viewing experience
    
    controlsTimerRef.current = window.setTimeout(() => {
      if (!isUserInteracting) {
        setIsControlsVisible(false);
      }
      setIsUserInteracting(false);
    }, hideDelay);
  };

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
