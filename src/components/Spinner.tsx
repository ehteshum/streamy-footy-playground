import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10'
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`inline-block ${className}`}>
      <div 
        className={`${sizeMap[size]} border-4 border-white/30 border-t-white rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default Spinner; 