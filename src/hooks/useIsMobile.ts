import { useState, useEffect } from 'react';

/**
 * Hook om te detecteren of de gebruiker op een mobile device zit
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check op basis van screen width (meest betrouwbaar)
      const isMobileWidth = window.innerWidth < 640; // sm breakpoint
      // Check ook op touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileWidth || isTouchDevice);
    };

    // Check direct
    checkMobile();

    // Luister naar resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
