
import React from 'react';

const BufferingIndicator: React.FC = () => {
  return (
    <div className="animate-pulse-subtle p-8 rounded-full">
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
    </div>
  );
};

export default BufferingIndicator;
