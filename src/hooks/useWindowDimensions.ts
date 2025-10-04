import { useState, useEffect } from 'react';

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return windowDimensions;
}
