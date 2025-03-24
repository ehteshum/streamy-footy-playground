
import React from 'react';

interface VideoTitleProps {
  title: string | undefined;
}

const VideoTitle: React.FC<VideoTitleProps> = ({ title }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
      <div className="text-white font-medium truncate">{title || 'Now Playing'}</div>
    </div>
  );
};

export default VideoTitle;
