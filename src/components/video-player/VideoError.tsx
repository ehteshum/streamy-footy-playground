
import React from 'react';

const VideoError: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mb-4">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3 className="text-xl font-semibold mb-2">Stream Error</h3>
      <p className="text-center max-w-md text-white/80">
        Unable to load the video stream. Please check the URL and try again.
      </p>
    </div>
  );
};

export default VideoError;
