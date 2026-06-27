"use client";

import { useState, useEffect } from "react";

// Standard Breakpoints from the design specification
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1200,
  xxl: 1440,
};

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // Initial set on mount to avoid hydration mismatch if SSR is used
    setWindowWidth(window.innerWidth);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: windowWidth > 0 && windowWidth < BREAKPOINTS.md,
    isTablet: windowWidth >= BREAKPOINTS.md && windowWidth < BREAKPOINTS.lg,
    isDesktop: windowWidth >= BREAKPOINTS.lg,
    width: windowWidth,
    // Provide a way to check if we've mounted (useful for preventing hydration errors)
    isMounted: windowWidth > 0,
  };
}
