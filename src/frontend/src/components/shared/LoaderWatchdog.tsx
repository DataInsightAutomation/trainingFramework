import React, { useEffect, useState } from 'react';
import { loaderState, resetLoader } from '../../apis/api';

// This component monitors the global loader state and forces a reset if it stays active too long
const LoaderWatchdog: React.FC = () => {
  const [isWatching, setIsWatching] = useState(false);
  
  useEffect(() => {
    // Subscribe to loader state changes
    const unsubscribe = loaderState.subscribe((isLoading) => {
      if (isLoading && !isWatching) {
        // Loader just became active, start watching
        setIsWatching(true);
      } else if (!isLoading && isWatching) {
        // Loader stopped, clear watching
        setIsWatching(false);
      }
    });
    
    return unsubscribe;
  }, [isWatching]);
  
  useEffect(() => {
    let watchdogTimer: NodeJS.Timeout | null = null;
    
    if (isWatching) {
      // If loader is active, set a 30-second timer to auto-reset
      watchdogTimer = setTimeout(() => {
        console.warn("Loader has been active for too long, forcing reset");
        resetLoader();
        setIsWatching(false);
      }, 30000); // 30 seconds timeout
    }
    
    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
    };
  }, [isWatching]);
  
  // This component doesn't render anything
  return null;
};

export default LoaderWatchdog;
