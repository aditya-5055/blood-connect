import { useState, useEffect } from "react";

// Custom hook for responsive breakpoints
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 640, // < sm
        isTablet: width >= 640 && width < 1024, // sm to lg
        isDesktop: width >= 1024 && width < 1280, // lg to xl
        isLargeDesktop: width >= 1280, // >= xl
        width,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

// Hook for mobile menu management
export const useMobileMenu = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const { isMobile } = useResponsive();

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
    isMobile,
  };
};
