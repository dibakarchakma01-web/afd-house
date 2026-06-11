import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state if the component mounts/remounts
  useEffect(() => {
    setImageError(false);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  if (imageError) {
    return (
      <div 
        id="afd-logo-fallback"
        className={`rounded-full bg-brand-green text-white font-sans font-black flex items-center justify-center shadow-inner shrink-0 ${selectedSizeClass} ${className}`}
      >
        A
      </div>
    );
  }

  return (
    <div 
      id="afd-logo-container"
      className={`rounded-full border border-gray-200/60 overflow-hidden shadow-sm flex items-center justify-center bg-white shrink-0 ${selectedSizeClass} ${className}`}
    >
      <img
        src="/logo.png?v=6"
        alt="AFD House Logo"
        onError={() => setImageError(true)}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
