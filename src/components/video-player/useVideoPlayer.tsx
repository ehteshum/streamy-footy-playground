<<<<<<< HEAD

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

=======
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';

// Basic HLS.js config optimized for stability and quick startup
const HLS_CONFIG = {
  // Core settings
  debug: false,                     // Disable debug for performance
  enableWorker: true,               // Use web workers
  lowLatencyMode: false,            // Disable low latency mode for stability
  
  // Buffer settings - EXTREME STABILITY FOCUS
  maxBufferLength: 30,              // Increased to 30s for maximum stability
  maxMaxBufferLength: 90,           // Greatly increased maximum to 90s during stable periods
  liveSyncDuration: 2,              // Only necessary for live streams
  
  // Startup settings
  startFragPrefetch: true,          // Prefetch initial fragments
  autoStartLoad: false,             // Don't start loading automatically, we'll control this
  manifestLoadingTimeOut: 45000,    // Even more time for manifest loading (45s)
  manifestLoadingMaxRetry: 12,      // Maximum retries for manifest loading
  manifestLoadingRetryDelay: 200,   // Even faster retry for manifest loading
  
  // Bandwidth detection - ABSOLUTE MINIMUM
  abrEwmaDefaultEstimate: 200000,   // Start with just 200kbps estimate (absolute minimum)
  abrBandWidthFactor: 0.4,          // Use only 40% of detected bandwidth (extremely conservative)
  abrEwmaFastLive: 1.5,             // Fastest possible adaptation
  abrEwmaSlowLive: 3.0,             // Extremely rapid quality reduction
  
  // Quality settings
  capLevelToPlayerSize: true,       // Limit quality based on player size
  startLevel: 0,                    // Always start at lowest quality level
  
  // Recovery settings
  fragLoadingMaxRetry: 12,          // More retries for fragments 
  levelLoadingMaxRetry: 12,         // More retries for levels
  
  // CRITICAL TWEAKS FOR CONTINUITY
  maxStarvationDelay: 1,            // Lower buffer before starvation (very aggressive)
  maxFragLookUpTolerance: 0.5,      // More precise fragment lookup
  maxLoadingDelay: 1,               // Shorter max loading time
  
  // Advanced streaming optimization
  appendErrorMaxRetry: 5,           // Max retries for append errors
  testBandwidth: true,              // More accurate bandwidth estimation
  progressive: true,                // Enable progressive parsing
  backBufferLength: 10,             // Keep 10s of back buffer (reduced to save memory)
  
  // Emergency auto recovery for segment loading
  fragLoadingRetryDelay: 250,       // Retry fragment loading even faster
  
  // Override XHR setup for better timeout handling
  xhrSetup: function(xhr: XMLHttpRequest) {
    xhr.timeout = 8000; // 8 seconds timeout (reduced)
  }
};

/**
 * Custom hook to handle video player functionality
 */
export const useVideoPlayer = (
  streamUrl: string, 
  forcePlayerType: 'hls' | 'dash' | 'native' | null = null
) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const playerTypeRef = useRef<'native' | 'hls' | 'dash' | null>(null);
  const bufferCheckTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const playAttemptCountRef = useRef<number>(0);
  
  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPiP, setIsPiP] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  
  // Buffer UI delay timer
  const bufferUITimerRef = useRef<number | null>(null);
  
  // Function to show buffering UI with delay to avoid flickering for brief interruptions
  const showBufferingWithDelay = useCallback((show: boolean) => {
    if (bufferUITimerRef.current) {
      window.clearTimeout(bufferUITimerRef.current);
      bufferUITimerRef.current = null;
    }
    
    if (show) {
      // Only show buffering UI after a 800ms delay to avoid flickering
      bufferUITimerRef.current = window.setTimeout(() => {
        setIsBuffering(true);
      }, 800);
    } else {
      // Hide immediately
      setIsBuffering(false);
    }
  }, []);
  
  // Function to destroy the current player
  const destroyPlayer = useCallback(() => {
    // Clear timers
    if (bufferCheckTimerRef.current) {
      window.clearInterval(bufferCheckTimerRef.current);
      bufferCheckTimerRef.current = null;
    }
    
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
    // Destroy HLS.js instance if exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Destroy Dash.js instance if exists
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }
    
    // Reset video element
    if (videoRef.current) {
      const video = videoRef.current;
      video.removeAttribute('src');
      video.load();
    }
    
    // Reset player type
    playerTypeRef.current = null;
    
    // Reset retry counter
    playAttemptCountRef.current = 0;
  }, []);
  
  // Setup HLS.js player
  const setupHlsPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return false;
    
    try {
      // Create new HLS instance
      const hls = new Hls(HLS_CONFIG);
      
      // Load source and attach to video
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      // Min buffer to accumulate before playback (in seconds)
      const MIN_BUFFER_BEFORE_PLAY = 2;          // Reduced to 2s for faster startup
      const MIN_STABLE_BUFFER_FOR_PLAY = 0.5;    // Will play with as little as 0.5s if needed
      const BUFFER_FOR_AUTO_QUALITY = 15;        // Increased buffer needed before auto quality
      const MAX_WAIT_TIME_MS = 8000;             // Max wait before starting anyway
      const EMERGENCY_START_TIME_MS = 12000;     // Emergency start after 12s regardless of buffer
      
      // Track buffer performance and load progress
      let bufferAttempts = 0;
      let lastBufferedAmount = 0;
      let bufferStalled = false;
      let hasPlaybackStarted = false;
      let preloadedSegments = false;
      const loadStartTime = Date.now();
      
      // Enhanced recovery system
      let recoveryAttempts = 0;
      let lastRecoveryTime = 0;
      let currentRecoveryLevel = 0; // 0=normal, 1=aggressive, 2=extreme, 3=desperation
      
      // Function to check if buffering has stalled
      const checkBufferStall = (currentBuffer: number) => {
        if (lastBufferedAmount === currentBuffer) {
          bufferAttempts++;
          
          // Escalate recovery based on how long we've been stalled
          if (bufferAttempts >= 3 && bufferAttempts < 6) {
            if (currentRecoveryLevel < 1) {
              currentRecoveryLevel = 1;
              console.log('⚠️ Buffer stall detected, activating aggressive loading');
              
              // Force lowest quality and try kickstarting loading
              hls.nextLevel = 0;
              hls.loadLevel = 0;
              hls.startLoad();
            }
          } 
          else if (bufferAttempts >= 6 && bufferAttempts < 10) {
            if (currentRecoveryLevel < 2) {
              currentRecoveryLevel = 2;
              console.log('🔥 Buffer severely stalled, activating extreme recovery');
              
              // More aggressive kickstart
              try {
                // Force flush buffer and reload
                hls.trigger(Hls.Events.BUFFER_FLUSHING, {
                  startOffset: 0,
                  endOffset: Number.POSITIVE_INFINITY,
                  type: 'audio'
                });
                setTimeout(() => hls.startLoad(), 100);
              } catch (e) {
                // Ignore any errors
              }
            }
          }
          else if (bufferAttempts >= 10) {
            bufferStalled = true;
            
            if (currentRecoveryLevel < 3) {
              currentRecoveryLevel = 3;
              console.log('🚨 CRITICAL: Buffer completely stalled, desperate measures');
              
              // Last resort - try to completely reload the stream
              recoveryAttempts++;
              lastRecoveryTime = Date.now();
              
              try {
                // Stop everything
                hls.stopLoad();
                
                // Wait a moment
                setTimeout(() => {
                  // Try reloading the stream
                  hls.loadSource(streamUrl);
                  hls.attachMedia(video);
                  setTimeout(() => hls.startLoad(), 50);
                }, 100);
              } catch (e) {
                // Ignore errors
              }
            }
            
            return true;
          }
        } else {
          // Buffer is increasing - improve recovery level if we were in recovery
          if (currentRecoveryLevel > 0) {
            currentRecoveryLevel = Math.max(0, currentRecoveryLevel - 1);
          }
          
          // Reset if buffer increased
          bufferAttempts = 0;
          lastBufferedAmount = currentBuffer;
          bufferStalled = false;
        }
        return bufferStalled;
      };
      
      // Function to aggressively preload content
      const preloadAggressively = () => {
        if (preloadedSegments) return;
        
        console.log('🚀 AGGRESSIVE PRELOADING: Forcing multiple segments to load');
        try {
          // Force lowest quality for initial loading
          hls.nextLevel = 0;
          hls.loadLevel = 0;
          
          // Start loading from beginning
          hls.startLoad(-1);
          
          // Load extra segments ahead by simulating progress
          setTimeout(() => {
            if (videoRef.current && !hasPlaybackStarted) {
              console.log('💪 SUPER AGGRESSIVE: Forcing extra segments load');
              hls.nextLevel = 0; // Keep at lowest quality
              
              // Request more segments by seeking ahead in buffer (without actually playing)
              const fakeDuration = 60; // Assume a long duration
              const targetPositions = [5, 10, 15, 20, 30]; // Additional positions to load fragments at
              
              // Load segments at multiple positions
              targetPositions.forEach(pos => {
                try {
                  // Trick the player into loading these segments
                  hls.trigger(Hls.Events.LEVEL_PTS_UPDATED, {
                    details: {
                      live: false,
                      totalduration: fakeDuration
                    },
                    level: 0
                  } as any);
                  
                  // Force fragment loading at this position
                  setTimeout(() => {
                    if (!hasPlaybackStarted) {
                      hls.trigger(Hls.Events.FRAG_LOADED, {
                        frag: {
                          start: pos
                        }
                      } as any);
                    }
                  }, 200);
                } catch (err) {
                  // Ignore errors here - aggressive loading can fail silently
                }
              });
            }
          }, 300); // Faster startup
          
          preloadedSegments = true;
        } catch (err) {
          console.error('Error during aggressive preloading:', err);
        }
      };
      
      // Function to actually start playback
      const startPlayback = (bufferedAmount: number, forceLowQuality = false) => {
        if (hasPlaybackStarted) return;
        
        console.log(`▶️ Starting playback after buffering ${bufferedAmount.toFixed(1)}s`);
        hasPlaybackStarted = true;
        
        // Start playback
        const video = videoRef.current;
        if (video) {
          // Start at reduced playback rate to give buffer time to grow
          let initialRate = 1.0;
          if (bufferedAmount < 1) {
            initialRate = 0.5; // Extremely slow when buffer is minimal
            console.log('🐌 Starting with severely reduced playback rate (0.5x) due to critically low buffer');
          } else if (bufferedAmount < 3) {
            initialRate = 0.75; // Very slow when buffer is small
            console.log('🐢 Starting with very reduced playback rate (0.75x) due to low buffer');
          } else if (bufferedAmount < 6) {
            initialRate = 0.9; // Slightly slow when buffer is moderate
            console.log('🐢 Starting with slightly reduced playback rate (0.9x) to build buffer');
          }
          
          video.playbackRate = initialRate;
          
          // Force lowest quality if starting with low buffer
          if (forceLowQuality || bufferedAmount < 3) {
            if (hlsRef.current) {
              hlsRef.current.nextLevel = 0; // Force lowest quality
              hlsRef.current.loadLevel = 0;
              console.log('📉 Forcing lowest quality due to low initial buffer');
            }
          }
          
          video.play().then(() => {
            console.log('🎉 Playback started successfully');
            setIsPlaying(true);
            showBufferingWithDelay(false);
            
            // Ensure HLS keeps loading even after playback starts
            if (hlsRef.current) {
              const hls = hlsRef.current;
              hls.startLoad(); // Force continued loading
              
              // Setup a recurring task to keep loading fragments
              const keepLoadingInterval = setInterval(() => {
                if (hlsRef.current && !video.paused) {
                  hlsRef.current.startLoad();
                } else {
                  clearInterval(keepLoadingInterval);
                }
              }, 5000); // Every 5 seconds
              
              // Clean up the interval if the component unmounts
              return () => clearInterval(keepLoadingInterval);
            }
            
            // Restore normal playback rate gradually based on buffer
            const checkBufferAndRestoreRate = () => {
              if (!videoRef.current) return;
              
              let currentBuffer = 0;
              if (videoRef.current.buffered.length > 0) {
                const buffered = videoRef.current.buffered;
                const currentTime = videoRef.current.currentTime;
                
                for (let i = 0; i < buffered.length; i++) {
                  if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
                    currentBuffer = buffered.end(i) - currentTime;
                    break;
                  }
                }
              }
              
              // Dynamically adjust playback rate based on buffer level
              const calculateOptimalRate = (buffer: number) => {
                if (buffer < 1) return 0.5;        // Critical buffer: very slow
                if (buffer < 2) return 0.75;       // Low buffer: slow
                if (buffer < 4) return 0.85;       // Building buffer: slightly slow
                if (buffer < 8) return 0.95;       // Good buffer: almost normal
                return 1.0;                         // Excellent buffer: normal
              };
              
              const optimalRate = calculateOptimalRate(currentBuffer);
              const currentRate = videoRef.current.playbackRate;
              
              // Move slowly towards optimal rate (avoid jarring changes)
              if (Math.abs(currentRate - optimalRate) > 0.05) {
                // If we need to slow down, do it immediately
                if (optimalRate < currentRate) {
                  videoRef.current.playbackRate = optimalRate;
                  console.log(`📉 Buffer low: ${currentBuffer.toFixed(1)}s - reduced rate to ${optimalRate.toFixed(2)}x`);
                } 
                // If we can speed up, do it gradually
                else if (optimalRate > currentRate) {
                  // Increase by 0.05 per step
                  const newRate = Math.min(optimalRate, currentRate + 0.05);
                  videoRef.current.playbackRate = newRate;
                  
                  if (newRate >= 1.0 && currentRate < 1.0) {
                    console.log(`✅ Fully restored normal playback rate - buffer: ${currentBuffer.toFixed(1)}s`);
                  } else {
                    console.log(`📈 Buffer improving: ${currentBuffer.toFixed(1)}s - increased rate to ${newRate.toFixed(2)}x`);
                  }
                }
              }
              
              // Continue monitoring
              setTimeout(checkBufferAndRestoreRate, currentBuffer < 3 ? 1000 : 2000);
            };
            
            // Start the gradual restoration process
            setTimeout(checkBufferAndRestoreRate, 2000);
            
            // Start increasing quality after plenty of buffer is built
            if (hlsRef.current) {
              // First quality bump after initial buffer is built
              setTimeout(() => {
                if (hlsRef.current) {
                  let currentBuffer = 0;
                  if (videoRef.current && videoRef.current.buffered.length > 0) {
                    const buffered = videoRef.current.buffered;
                    const currentTime = videoRef.current.currentTime;
                    
                    for (let i = 0; i < buffered.length; i++) {
                      if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
                        currentBuffer = buffered.end(i) - currentTime;
                        break;
                      }
                    }
                  }
                  
                  // If we have some buffer, start with a conservative quality level
                  // Don't go straight to auto just yet
                  if (currentBuffer >= 6) {
                    try {
                      const levels = hlsRef.current.levels;
                      // If we have at least 3 quality levels, pick the second lowest
                      if (levels && levels.length > 2) {
                        hlsRef.current.nextLevel = 1; // Second lowest quality
                        console.log('📊 Initial quality bump to second-lowest quality');
                      }
                    } catch (e) {
                      // Ignore errors
                    }
                  }
                  
                  // Schedule full auto quality later
                  setTimeout(() => {
                    if (hlsRef.current) {
                      let latestBuffer = 0;
                      if (videoRef.current && videoRef.current.buffered.length > 0) {
                        const buffered = videoRef.current.buffered;
                        const currentTime = videoRef.current.currentTime;
                        
                        for (let i = 0; i < buffered.length; i++) {
                          if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
                            latestBuffer = buffered.end(i) - currentTime;
                            break;
                          }
                        }
                      }
                      
                      // Only enable auto quality when we have plenty of buffer
                      if (latestBuffer >= BUFFER_FOR_AUTO_QUALITY) {
                        hlsRef.current.nextLevel = -1; // Auto level
                        console.log('🔄 Enabled full auto quality selection after solid buffer built');
                      } else {
                        // Not enough buffer yet, be more conservative
                        console.log(`⚠️ Buffer only ${latestBuffer.toFixed(1)}s - staying at low quality`);
                        
                        // Schedule one more check
                        setTimeout(() => {
                          if (hlsRef.current) {
                            hlsRef.current.nextLevel = -1; // Auto level
                            console.log('🔄 Now enabling auto quality selection (delayed)');
                          }
                        }, 10000);
                      }
                    }
                  }, 10000); // Check after 10 seconds
                }
              }, 5000); // First quality bump attempt after 5s
            }
          }).catch(error => {
            console.error('❌ Playback failed:', error);
            setIsPlaying(false);
            
            // Try again with absolute lowest settings
            if (hlsRef.current) {
              hlsRef.current.nextLevel = 0;
              setTimeout(() => {
                if (videoRef.current) {
                  video.playbackRate = 0.5; // Start extremely slow
                  video.play().catch(() => {
                    console.error('❌ Retry playback also failed');
                    
                    // Last resort: try to completely refresh the player
                    setTimeout(() => {
                      if (hlsRef.current && videoRef.current) {
                        try {
                          hlsRef.current.stopLoad();
                          hlsRef.current.startLoad();
                          videoRef.current.play().catch(() => {});
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                    }, 1000);
                  });
                }
              }, 1000);
            }
          });
        }
      };
      
      // Save reference
      hlsRef.current = hls;
      playerTypeRef.current = 'hls';
      
      console.log('HLS.js player initialized');
      
      // Handle HLS events
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log('📱 HLS manifest parsed, starting ULTRA AGGRESSIVE buffering');
        
        // Force lowest quality level for fastest start
        hls.nextLevel = 0;
        hls.startLoad(-1); // Start loading from the beginning
        
        console.log(`📊 Found ${data.levels.length} quality levels, aggressive preloading lowest`);
        setIsBuffering(true);
        
        // ULTRA AGGRESSIVE: Preload multiple fragments immediately
        preloadAggressively();
        
        // Continue loading more aggressively after a short delay
        setTimeout(() => {
          if (!hasPlaybackStarted) {
            preloadAggressively();
          }
        }, 800);
        
        // Set a timer to check buffer progress and start anyway if we have enough
        const initialBufferTimer = setInterval(() => {
          if (hasPlaybackStarted) {
            clearInterval(initialBufferTimer);
            return;
          }
          
          const buffered = video.buffered;
          let bufferedAhead = 0;
          
          if (buffered.length > 0) {
            // Get the end of the first buffer range
            bufferedAhead = buffered.end(0);
            const isStalled = checkBufferStall(bufferedAhead);
            
            console.log('🔄 Initial buffering: ' + Math.round(bufferedAhead * 10) / 10 + 's of ' + MIN_BUFFER_BEFORE_PLAY + 's (stalled: ' + isStalled + ')');
            
            // Determine if we should start based on time waited
            const timeWaited = Date.now() - loadStartTime;
            const shouldStartAnyway = timeWaited > MAX_WAIT_TIME_MS;
            const emergencyStart = timeWaited > EMERGENCY_START_TIME_MS;
            
            // Start playback sooner with low quality if buffer is stalled
            if (isStalled && bufferedAhead >= MIN_STABLE_BUFFER_FOR_PLAY) {
              console.log('🚨 Buffer stalled but we have enough to start with low quality');
              clearInterval(initialBufferTimer);
              hls.nextLevel = 0; // Force lowest quality
              startPlayback(bufferedAhead);
            }
            // Start playback once we have enough buffer
            else if (bufferedAhead >= MIN_BUFFER_BEFORE_PLAY) {
              console.log('✅ Buffer ready, starting playback');
              clearInterval(initialBufferTimer);
              startPlayback(bufferedAhead);
            }
            // If we've waited too long, start anyway
            else if (Date.now() - loadStartTime > 10000 && bufferedAhead >= 1) {
              console.log('⏱️ Waited too long, starting anyway with reduced playback rate');
              clearInterval(initialBufferTimer);
              startPlayback(bufferedAhead, true);
            }
          }
        }, 200); // Check every 200ms for faster response
      });
      
      // Extra event to monitor fragment loading - preload more if needed
      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        if (hasPlaybackStarted) return;
        
        // Only log every 3rd fragment to reduce console spam
        if (data.frag.sn && Number(data.frag.sn) % 3 === 0) {
          console.log(`Fragment ${data.frag.sn} loaded, type: ${data.frag.type}`);
        }
      });
      
      // Monitor buffer and only start playback when we have enough buffer
      hls.on(Hls.Events.FRAG_BUFFERED, (_, data) => {
        if (hasPlaybackStarted) return;
        
        const buffered = video.buffered;
        let bufferedAhead = 0;
        
        if (buffered.length > 0) {
          // Get the end of the first buffer range
          bufferedAhead = buffered.end(0);
          
          // Use string concatenation instead of template literals with toFixed
          console.log('Initial buffering: ' + Math.round(bufferedAhead * 10) / 10 + 's of ' + MIN_BUFFER_BEFORE_PLAY + 's');
          
          // If we have enough buffer, start playback
          if (bufferedAhead >= MIN_BUFFER_BEFORE_PLAY) {
            startPlayback(bufferedAhead);
          }
        }
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS error:', data.type, data.details);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting recovery');
              hls.startLoad();
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery');
              hls.recoverMediaError();
              break;
              
            default:
              console.log('Fatal error, switching to fallback');
              destroyPlayer();
              // Try DASH player as a fallback without circular reference
              setTimeout(() => {
                if (playerTypeRef.current !== 'dash') {
                  try {
                    const dashPlayer = dashjs.MediaPlayer().create();
                    const video = videoRef.current;
                    if (video && streamUrl) {
                      dashPlayer.initialize(video, streamUrl, false);
                      dashRef.current = dashPlayer;
                      playerTypeRef.current = 'dash';
                      console.log('Switched to Dash.js player as fallback');
                    }
                  } catch (e) {
                    console.error('Failed to initialize DASH fallback:', e);
                  }
                }
              }, 100);
              break;
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error setting up HLS player:', error);
      return false;
    }
  }, [streamUrl, destroyPlayer]);
  
  // Setup Dash.js player
  const setupDashPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return false;
    
    try {
      // Create new Dash.js instance
      const dash = dashjs.MediaPlayer().create();
      
      // Configure player
      dash.updateSettings({
        debug: {
          logLevel: dashjs.Debug.LOG_LEVEL_ERROR
        },
        streaming: {
          buffer: {
            fastSwitchEnabled: true,
            bufferTimeAtTopQuality: 30,           // Reduced for more responsive behavior
            bufferTimeAtTopQualityLongForm: 60    // Reduced for more responsive behavior
          },
          abr: {
            initialBitrate: { video: 1500 }       // Start with moderate quality for faster startup
          },
          gaps: {
            jumpGaps: true                        // Jump over gaps in the timeline
          },
          lastBitrateCachingInfo: { enabled: true } // Cache bitrate information
        }
      });
      
      // Initialize player
      dash.initialize(video, streamUrl, false);
      dash.setAutoPlay(false);
      
      // Save reference
      dashRef.current = dash;
      playerTypeRef.current = 'dash';
      
      console.log('Dash.js player initialized');
      
      // Attempt playback when ready
      dash.on('canPlay', attemptPlay);
      
      return true;
    } catch (error) {
      console.error('Error setting up Dash player:', error);
      return false;
    }
  }, [streamUrl, destroyPlayer]);
  
  // Native player setup
  const setupNativePlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return false;
    
    try {
      // Set up native player
      video.src = streamUrl;
      playerTypeRef.current = 'native';
      
      console.log('Native player initialized');
      
      // We'll attempt to play after a small delay
      setTimeout(attemptPlay, 500);
      
      return true;
    } catch (error) {
      console.error('Error setting up native player:', error);
      return false;
    }
  }, [streamUrl]);
  
  // Attempt to play the video
  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    playAttemptCountRef.current++;
    console.log(`Play attempt #${playAttemptCountRef.current}`);
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Playback started successfully');
          setIsPlaying(true);
          showBufferingWithDelay(false);
          
          // Start monitoring buffer
          startBufferMonitoring();
        })
        .catch(error => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
          
          // If this isn't our last attempt, try again
          if (playAttemptCountRef.current < 3) {
            console.log('Retrying playback...');
            retryTimerRef.current = window.setTimeout(() => {
              attemptPlay();
            }, 1000);
          } else if (playerTypeRef.current === 'hls') {
            // If HLS failed, try DASH
            console.log('HLS player failed, trying Dash.js');
            destroyPlayer();
            setupDashPlayer();
          } else if (playerTypeRef.current === 'dash') {
            // If DASH failed, try native
            console.log('Dash.js player failed, trying native player');
            destroyPlayer();
            setupNativePlayer();
          } else {
            // All methods failed
            console.error('All playback methods failed');
            setIsError(true);
            showBufferingWithDelay(false);
            toast.error('Failed to play video stream');
          }
        });
    }
  }, [destroyPlayer, setupDashPlayer, setupNativePlayer]);
  
  // Constants for buffer thresholds (ULTRA STABLE PLAYBACK)
  const CRITICAL_BUFFER = 0.2;    // Almost no buffer required to keep playing
  const LOW_BUFFER = 1;           // Very low buffer threshold
  const GOOD_BUFFER = 3;          // Good buffer reduced to 3s
  const TARGET_BUFFER = 2;        // Target buffer reduced to 2s
  
  // Function to force continuous playback
  const forceContinuousPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    console.log('🚨 FORCING CONTINUOUS PLAYBACK - Emergency recovery mode');
    
    // Always set lowest possible quality for HLS
    if (playerTypeRef.current === 'hls' && hlsRef.current) {
      hlsRef.current.nextLevel = 0;
      hlsRef.current.loadLevel = 0;
      hlsRef.current.startLoad();
      console.log('📉 HLS EMERGENCY: Forced lowest quality');
      
      // Trick HLS into loading more aggressively
      try {
        const currentTime = video.currentTime;
        const fragStart = Math.floor(currentTime);
        
        // Tell HLS where we are to help it load the right fragments
        hlsRef.current.trigger(Hls.Events.BUFFER_APPENDING, {
          data: new Uint8Array(1),
          type: 'video',
          id: 'main',
          frag: {
            start: fragStart
          }
        } as any);
      } catch (e) {
        // Ignore any errors - this is just a boost attempt
      }
    }
    
    // Force ultra-low quality for DASH
    if (playerTypeRef.current === 'dash' && dashRef.current) {
      dashRef.current.updateSettings({
        streaming: {
          abr: {
            initialBitrate: { video: 100 },  // Ultra low quality
            maxBitrate: { video: 300 }       // Cap at very low quality
          },
          buffer: {
            bufferTimeAtTopQuality: 8,       // Reduce buffer goals
            bufferTimeAtTopQualityLongForm: 10
          }
        }
      });
      console.log('📉 DASH EMERGENCY: Forced lowest quality');
    }
    
    // Lower playback rate immediately if not paused
    if (!video.paused) {
      const newRate = 0.6; // Very slow playback
      if (video.playbackRate > newRate) {
        video.playbackRate = newRate;
        console.log(`🐢 EMERGENCY: Reduced playback rate to ${newRate}x`);
      }
    }
  }, []);
  
  // Start buffer monitoring with extreme continuity settings
  const startBufferMonitoring = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (bufferCheckTimerRef.current) {
      window.clearInterval(bufferCheckTimerRef.current);
    }
    
    // Track buffer performance
    let lowBufferCount = 0;
    let criticalBufferCount = 0;
    let lastQualityReduction = 0;
    let originalPlaybackRate = video.playbackRate || 1;
    let lastBufferLevel = 0;
    let bufferDecreasingCount = 0;
    let lastBufferCheckTime = Date.now();
    let emergencyModeActive = false;
    
    // EXTREME: Set initial low quality for guaranteed playback
    forceContinuousPlayback();
    
    // Force HLS to always use lowest quality initially
    if (playerTypeRef.current === 'hls' && hlsRef.current) {
      hlsRef.current.nextLevel = 0;
      hlsRef.current.startLoad();
    }
    
    // Fast check interval 
    const fastCheckIntervalMs = 150; // Even faster checks
    
    bufferCheckTimerRef.current = window.setInterval(() => {
      if (!video || video.paused) return;
      
      let bufferedAhead = 0;
      
      // Calculate buffer ahead
      if (video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          const start = video.buffered.start(i);
          const end = video.buffered.end(i);
          
          if (video.currentTime >= start && video.currentTime <= end) {
            bufferedAhead = end - video.currentTime;
            break;
          }
        }
      }
      
      // Only log every 5 seconds to reduce console spam
      const shouldLogDetails = Math.round(video.currentTime) % 5 === 0;
      if (shouldLogDetails && bufferedAhead > 0) {
        console.log(`Buffer status: ${bufferedAhead.toFixed(1)}s ahead`);
      }
      
      // EXTREME: Force continuous preloading for HLS
      if (playerTypeRef.current === 'hls' && hlsRef.current) {
        hlsRef.current.startLoad();
      }
      
      // PREDICTIVE: Check if buffer might be trending downward
      const now = Date.now();
      const timeDiff = (now - lastBufferCheckTime) / 1000;
      const bufferDiff = lastBufferLevel - bufferedAhead;
      lastBufferCheckTime = now;
      
      if (timeDiff > 0 && lastBufferLevel > 0 && bufferDiff > 0) {
        // Buffer is decreasing, potentially problematic
        bufferDecreasingCount++;
        
        // Take preemptive action if buffer is decreasing rapidly
        if (bufferDecreasingCount >= 2 || bufferDiff / timeDiff > 0.8) {
          forceContinuousPlayback();
        }
      } else {
        // Buffer stable or increasing
        bufferDecreasingCount = Math.max(0, bufferDecreasingCount - 1);
      }
      
      // Update for next comparison
      lastBufferLevel = bufferedAhead;
      
      // Keep playback rate low when buffer is marginal (< 2s)
      if (bufferedAhead < 2 && !emergencyModeActive) {
        if (video.playbackRate > 0.7) {
          video.playbackRate = 0.7;
        }
      } 
      // Allow normal playback when buffer is good
      else if (bufferedAhead >= 3 && video.playbackRate < 1) {
        video.playbackRate = 1;
      }
      
      // Buffer states - MUCH MORE PERMISSIVE
      if (bufferedAhead < CRITICAL_BUFFER) {
        criticalBufferCount++;
        
        // Only trigger emergency after multiple checks to avoid flashing
        if (criticalBufferCount >= 2) {
          if (!emergencyModeActive) {
            console.log('Low buffer detected, switching to ultra-stable mode');
            emergencyModeActive = true;
            
            // Force extreme stability mode
            forceContinuousPlayback();
            
            // Only pause if absolutely necessary
            if (bufferedAhead === 0) {
              video.pause();
              showBufferingWithDelay(true);
              
              // Ultra-quick small buffer check
              const recoveryInterval = setInterval(() => {
                if (!videoRef.current) {
                  clearInterval(recoveryInterval);
                  return;
                }
                
                // Check buffer
                let currentBuffer = 0;
                const v = videoRef.current;
                
                if (v.buffered.length > 0) {
                  // Find applicable buffer range
                  for (let i = 0; i < v.buffered.length; i++) {
                    if (v.currentTime >= v.buffered.start(i) && 
                        v.currentTime <= v.buffered.end(i)) {
                      currentBuffer = v.buffered.end(i) - v.currentTime;
                      break;
                    }
                  }
                }
                
                // Resume with ANY buffered content
                if (currentBuffer > TARGET_BUFFER / 2) {
                  clearInterval(recoveryInterval);
                  v.playbackRate = 0.7; // Start very slow
                  
                  v.play()
                    .then(() => {
                      showBufferingWithDelay(false);
                      // Keep emergency mode active for a while
                      setTimeout(() => {
                        emergencyModeActive = false;
                      }, 10000);
                    })
                    .catch(err => {
                      console.error('Resume failed:', err);
                      // Keep trying but less often
                      setTimeout(() => {
                        v.play().catch(() => {});
                      }, 1000);
                    });
                }
              }, 100);
            }
          }
        }
      } else {
        // Not in critical state, reset counter
        criticalBufferCount = 0;
        
        // Exit emergency mode if buffer is consistently good
        if (emergencyModeActive && bufferedAhead > GOOD_BUFFER) {
          emergencyModeActive = false;
        }
      }
    }, fastCheckIntervalMs);
  }, []);
  
  // Initialize the video player when stream URL changes
  useEffect(() => {
    console.log('Stream URL changed, initializing player:', streamUrl);
    
    // Reset states
    setIsError(false);
    setIsBuffering(true);
    
    // Destroy existing player
    destroyPlayer();
    
    // Initialize the appropriate player
    const initPlayer = () => {
      const video = videoRef.current;
      if (!video) return;
      
      // If a specific player type is forced, try only that type
      if (forcePlayerType) {
        console.log(`Forcing ${forcePlayerType} player as requested`);
        
        if (forcePlayerType === 'hls') {
          if (Hls.isSupported()) {
            if (setupHlsPlayer()) return;
            console.error('Forced HLS player failed to initialize');
          } else {
            console.error('HLS.js is not supported in this browser');
          }
        } else if (forcePlayerType === 'dash') {
          if (setupDashPlayer()) return;
          console.error('Forced DASH player failed to initialize');
        } else if (forcePlayerType === 'native') {
          if (setupNativePlayer()) return;
          console.error('Forced native player failed to initialize');
        }
        
        // If the forced player failed, show error
        setIsError(true);
        toast.error(`Forced ${forcePlayerType} player failed to initialize`);
        return;
      }
      
      // Auto-select player type if no forced type
      // Try HLS.js first if supported
      if (Hls.isSupported()) {
        console.log('HLS.js is supported, trying first');
        if (setupHlsPlayer()) return;
      }
      
      // Try Dash.js if HLS.js fails or isn't supported
      console.log('Trying Dash.js player');
      if (setupDashPlayer()) return;
      
      // Fall back to native player
      console.log('Falling back to native player');
      if (setupNativePlayer()) return;
      
      // If all methods fail
      console.error('All player initialization methods failed');
      setIsError(true);
      toast.error('Failed to initialize video player');
    };
    
    // Give a moment for the component to fully mount
    setTimeout(initPlayer, 100);
    
    // Cleanup on unmount or URL change
    return () => {
      destroyPlayer();
      // Clear any remaining buffer UI timer
      if (bufferUITimerRef.current) {
        window.clearTimeout(bufferUITimerRef.current);
        bufferUITimerRef.current = null;
      }
    };
  }, [streamUrl, forcePlayerType, destroyPlayer, setupHlsPlayer, setupDashPlayer, setupNativePlayer]);
  
>>>>>>> 36583a8 (Initial commit)
  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
<<<<<<< HEAD

=======
    
>>>>>>> 36583a8 (Initial commit)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
<<<<<<< HEAD

  // Handle Picture-in-Picture changes
  useEffect(() => {
    const handlePiPChange = (e: any) => {
      setIsPiP(document.pictureInPictureElement === videoRef.current);
    };

=======
  
  // Handle Picture-in-Picture changes
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiP(document.pictureInPictureElement === videoRef.current);
    };
    
>>>>>>> 36583a8 (Initial commit)
    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);
    
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);
<<<<<<< HEAD

  // Auto-hide controls
  useEffect(() => {
    const startControlsTimer = () => {
      // Clear any existing timer
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }

      // Only hide controls if user is not interacting and video is playing
=======
  
  // Auto-hide controls
  useEffect(() => {
    const startControlsTimer = () => {
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
      
>>>>>>> 36583a8 (Initial commit)
      if (isPlaying && !isUserInteracting) {
        controlsTimerRef.current = window.setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      }
    };
<<<<<<< HEAD

=======
    
>>>>>>> 36583a8 (Initial commit)
    if (isPlaying) {
      startControlsTimer();
    } else {
      setIsControlsVisible(true);
    }
<<<<<<< HEAD

=======
    
>>>>>>> 36583a8 (Initial commit)
    return () => {
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isPlaying, isUserInteracting]);
<<<<<<< HEAD

=======
  
>>>>>>> 36583a8 (Initial commit)
  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
<<<<<<< HEAD

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

=======
    
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const onDurationChange = () => {
      setDuration(video.duration || 0);
    };
    
    const onPlaying = () => {
      setIsPlaying(true);
      showBufferingWithDelay(false);
    };
    
    const onPause = () => {
      setIsPlaying(false);
    };
    
    const onWaiting = () => {
      // Only show buffering UI if we're actively playing (avoid showing during initial load)
      if (isPlaying) {
        showBufferingWithDelay(true);
      } else {
        setIsBuffering(true); // For initial load, show immediately
      }
    };
    
>>>>>>> 36583a8 (Initial commit)
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
<<<<<<< HEAD

    const onError = () => {
      setIsError(true);
      setIsBuffering(false);
      toast.error('Failed to load video stream');
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

=======
    
    const onError = () => {
      console.error('Video element error:', video.error);
      
      // Only set error if we've tried all player types
      if (playerTypeRef.current === 'native' || playAttemptCountRef.current >= 3) {
        setIsError(true);
        showBufferingWithDelay(false);
        toast.error('Failed to load video stream');
      } else {
        // Try next player type
        if (playerTypeRef.current === 'hls') {
          console.log('HLS player failed, trying Dash.js');
          destroyPlayer();
          setupDashPlayer();
        } else if (playerTypeRef.current === 'dash') {
          console.log('Dash.js player failed, trying native player');
          destroyPlayer();
          setupNativePlayer();
        }
      }
    };
    
    const onEnded = () => {
      setIsPlaying(false);
    };
    
>>>>>>> 36583a8 (Initial commit)
    // Add event listeners
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);
<<<<<<< HEAD

=======
    
>>>>>>> 36583a8 (Initial commit)
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
<<<<<<< HEAD
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
=======
  }, [destroyPlayer, setupDashPlayer, setupNativePlayer]);
  
  // Controls handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(err => {
        console.error('Play failed:', err);
>>>>>>> 36583a8 (Initial commit)
        toast.error('Failed to play video');
      });
    } else {
      video.pause();
    }
<<<<<<< HEAD
    setIsPlaying(!video.paused);
  };

  const toggleMute = () => {
=======
  }, []);
  
  const toggleMute = useCallback(() => {
>>>>>>> 36583a8 (Initial commit)
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
<<<<<<< HEAD
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
=======
  }, []);
  
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
>>>>>>> 36583a8 (Initial commit)
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
<<<<<<< HEAD
    setVolume(newVolume);
=======
>>>>>>> 36583a8 (Initial commit)
    
    if (newVolume === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
<<<<<<< HEAD
    
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
=======
  }, []);
  
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
>>>>>>> 36583a8 (Initial commit)
    const video = videoRef.current;
    if (!video) return;
    
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
<<<<<<< HEAD
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
=======
  }, []);
  
  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Fullscreen failed:', err);
        toast.error('Failed to enter fullscreen mode');
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  }, []);
  
  const togglePictureInPicture = useCallback(async () => {
>>>>>>> 36583a8 (Initial commit)
    const video = videoRef.current;
    if (!video) return;
    
    try {
      if (document.pictureInPictureElement !== video) {
        await video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
<<<<<<< HEAD
      toast.error('Picture-in-Picture is not supported or enabled');
    }
  };

  // Format time (seconds to mm:ss)
  const formatTime = (timeInSeconds: number) => {
=======
      console.error('PiP failed:', error);
      toast.error('Picture-in-Picture is not supported or enabled');
    }
  }, []);
  
  const formatTime = useCallback((timeInSeconds: number) => {
>>>>>>> 36583a8 (Initial commit)
    if (!isFinite(timeInSeconds)) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
<<<<<<< HEAD
  };

  const handleUserInteraction = () => {
=======
  }, []);
  
  const handleUserInteraction = useCallback(() => {
>>>>>>> 36583a8 (Initial commit)
    setIsControlsVisible(true);
    setIsUserInteracting(true);
    
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
    }
    
    controlsTimerRef.current = window.setTimeout(() => {
      setIsUserInteracting(false);
    }, 1000);
<<<<<<< HEAD
  };

  return {
    videoRef,
=======
  }, []);
  
  return {
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
=======
    handleUserInteraction,
    playerType: playerTypeRef.current
>>>>>>> 36583a8 (Initial commit)
  };
};
