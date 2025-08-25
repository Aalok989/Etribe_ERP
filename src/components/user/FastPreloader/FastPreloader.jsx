import React, { useState, useEffect } from 'react';

const FastPreloader = () => {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Animate loading dots
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 300);

    return () => {
      clearInterval(progressInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo/Brand section */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Glowing circle behind logo */}
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            
            {/* Main logo circle */}
            <div className="relative w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full border border-white/30 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">E</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mt-6 mb-2 tracking-wider">
            ETribe
          </h1>
          <p className="text-blue-100 text-lg font-medium">
            Business Community Platform
          </p>
        </div>

        {/* Enhanced loading animation */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Outer ring */}
            <div className="w-20 h-20 border-4 border-white/30 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-white rounded-full animate-spin"></div>
            </div>
            
            {/* Inner ring */}
            <div className="absolute inset-2 w-16 h-16 border-4 border-blue-300/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            
            {/* Center dot */}
            <div className="absolute inset-4 w-8 h-8 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Loading your dashboard
          </h2>
          <p className="text-blue-100 text-sm">
            Preparing your workspace{dots}
          </p>
        </div>

        {/* Enhanced progress bar */}
        <div className="w-64 bg-white/20 rounded-full h-3 mx-auto backdrop-blur-sm border border-white/30 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress percentage */}
        <div className="mt-3">
          <span className="text-blue-200 text-sm font-medium">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Loading tips */}
        <div className="mt-8 text-blue-100 text-xs opacity-80">
          <p>Optimizing your experience...</p>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default FastPreloader;

