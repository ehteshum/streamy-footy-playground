import React, { useState, useEffect } from 'react';

interface DiagnosticOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isEnabled?: boolean;
  playerType?: 'native' | 'hls' | 'dash' | null;
}

const DiagnosticOverlay: React.FC<DiagnosticOverlayProps> = ({ 
  videoRef, 
  isEnabled = false,
  playerType = null
}) => {
  const [stats, setStats] = useState({
    resolution: '0x0',
    bufferLength: 0,
    bufferRanges: '',
    currentQuality: 'Unknown',
    downloadSpeed: 0,
    droppedFrames: 0,
    framerate: 0,
    totalBuffered: 0
  });
  
  useEffect(() => {
    if (!isEnabled) return;
    
    // Update stats every second
    const intervalId = setInterval(() => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      
      // Calculate buffer length
      let bufferLength = 0;
      let bufferRanges = '';
      let totalBuffered = 0;
      
      if (video.buffered && video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          const start = video.buffered.start(i);
          const end = video.buffered.end(i);
          const duration = end - start;
          totalBuffered += duration;
          bufferRanges += `[${start.toFixed(1)}-${end.toFixed(1)}] `;
          
          // Find the range that contains current time
          if (video.currentTime >= start && video.currentTime <= end) {
            bufferLength = end - video.currentTime;
          }
        }
      }
      
      // Get video resolution
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      setStats(prev => ({
        ...prev,
        resolution: `${width}x${height}`,
        bufferLength: bufferLength,
        bufferRanges: bufferRanges,
        totalBuffered: totalBuffered,
        // Other stats would require HLS.js API access
      }));
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [videoRef, isEnabled]);
  
  // Function to get buffer status class
  const getBufferStatusClass = (seconds: number) => {
    if (seconds < 2) return "text-red-500 font-bold"; // Critical (less than 2s)
    if (seconds < 5) return "text-yellow-500 font-bold"; // Low (less than 5s)
    if (seconds < 8) return "text-yellow-300"; // Below target (less than 8s)
    if (seconds > 20) return "text-green-300 font-bold"; // Excellent (more than 20s)
    return "text-green-500"; // Good (between 8-20s)
  };
  
  // Function to get buffer status message
  const getBufferStatusMessage = (seconds: number) => {
    if (seconds < 2) return "CRITICAL";
    if (seconds < 5) return "LOW";
    if (seconds < 8) return "BELOW TARGET";
    if (seconds > 20) return "EXCELLENT";
    return "GOOD";
  };
  
  // Get playback rate class
  const getPlaybackRateClass = (rate: number) => {
    if (rate < 0.8) return "text-yellow-500";
    if (rate < 1) return "text-yellow-300";
    return "text-white";
  };
  
  if (!isEnabled) return null;
  
  // Current playback rate
  const playbackRate = videoRef.current?.playbackRate || 1;
  
  return (
    <div className="diagnostic-overlay absolute top-0 left-0 bg-black/70 text-white text-xs p-2 m-2 rounded z-50 font-mono">
      <div>Player: <span className="font-bold">{playerType || 'Unknown'}</span></div>
      <div>Resolution: {stats.resolution}</div>
      <div>
        Buffer: <span className={getBufferStatusClass(stats.bufferLength)}>
          {stats.bufferLength.toFixed(1)}s ({getBufferStatusMessage(stats.bufferLength)})
        </span>
      </div>
      <div>Target: 8s | Min: 3s | Low: 5s | Critical: 2s</div>
      <div>Total Buffered: {stats.totalBuffered?.toFixed(1) || '0'}s</div>
      <div>Current Time: {videoRef.current?.currentTime.toFixed(1) || '0'}s</div>
      <div>
        Playback Rate: <span className={getPlaybackRateClass(playbackRate)}>
          {playbackRate.toFixed(2)}x
        </span>
        {playbackRate < 1 && " (slowed)"}
      </div>
      <div className="text-xs opacity-75">Ranges: {stats.bufferRanges}</div>
    </div>
  );
};

export default DiagnosticOverlay; 