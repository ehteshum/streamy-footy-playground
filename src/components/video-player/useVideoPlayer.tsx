
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';

export const useVideoPlayer = (streamUrl: string) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const controlsTimerRef = useRef<number | null>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Picture-in-Picture changes
  useEffect(() => {
    const handlePiPChange = (e: any) => {
      setIsPiP(document.pictureInPictureElement === videoRef.current);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);
    
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const startControlsTimer = () => {
      // Clear any existing timer
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }

      // Only hide controls if user is not interacting and video is playing
      if (isPlaying && !isUserInteracting) {
        controlsTimerRef.current = window.setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      }
    };

    if (isPlaying) {
      startControlsTimer();
    } else {
      setIsControlsVisible(true);
    }

    return () => {
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isPlaying, isUserInteracting]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onDurationChange = () => {
      setDuration(video.duration);
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onWaiting = () => {
      setIsBuffering(true);
    };

    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const onError = () => {
      setIsError(true);
      setIsBuffering(false);
      toast.error('Failed to load video stream');
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);

    // Cleanup
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  // Load video when URL changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsError(false);
    setIsBuffering(true);
    
    video.load();
    
    // Attempt to play immediately
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Auto-play started successfully
          setIsPlaying(true);
        })
        .catch(error => {
          // Auto-play was prevented
          setIsPlaying(false);
          console.log('Auto-play was prevented:', error);
        });
    }
  }, [streamUrl]);

  // Controls handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(err => {
        toast.error('Failed to play video');
      });
    } else {
      video.pause();
    }
    setIsPlaying(!video.paused);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
    
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const container = document.getElementById('video-container');
      if (container) {
        container.requestFullscreen().catch(err => {
          toast.error('Failed to enter fullscreen mode');
        });
      }
    } else {
      document.exitFullscreen();
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      if (document.pictureInPictureElement !== video) {
        await video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      toast.error('Picture-in-Picture is not supported or enabled');
    }
  };

  // Format time (seconds to mm:ss)
  const formatTime = (timeInSeconds: number) => {
    if (!isFinite(timeInSeconds)) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleUserInteraction = () => {
    setIsControlsVisible(true);
    setIsUserInteracting(true);
    
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
    }
    
    controlsTimerRef.current = window.setTimeout(() => {
      setIsUserInteracting(false);
    }, 1000);
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
