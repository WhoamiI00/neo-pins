import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useGSAP = () => {
  const timeline = useRef<gsap.core.Timeline>();

  useEffect(() => {
    timeline.current = gsap.timeline();
    return () => {
      timeline.current?.kill();
    };
  }, []);

  return {
    timeline: timeline.current,
    gsap,
  };
};

// Predefined animation utilities
export const gsapAnimations = {
  fadeInUp: (element: HTMLElement, delay = 0, duration = 0.6) => {
    gsap.fromTo(
      element,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration, delay, ease: "power2.out" }
    );
  },

  scaleIn: (element: HTMLElement, delay = 0, duration = 0.4) => {
    gsap.fromTo(
      element,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, ease: "back.out(1.7)" }
    );
  },

  slideInRight: (element: HTMLElement, delay = 0, duration = 0.6) => {
    gsap.fromTo(
      element,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: "power2.out" }
    );
  },

  staggerFadeIn: (elements: NodeListOf<Element> | Element[], delay = 0.1) => {
    gsap.fromTo(
      elements,
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.6, 
        stagger: delay, 
        ease: "power2.out" 
      }
    );
  },

  hoverScale: (element: HTMLElement) => {
    const handleMouseEnter = () => {
      gsap.to(element, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  },

  pinHover: (element: HTMLElement) => {
    const handleMouseEnter = () => {
      gsap.to(element, {
        y: -8,
        scale: 1.03,
        duration: 0.4,
        ease: "power2.out",
        boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.15)"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
        boxShadow: "0 8px 30px -4px rgba(0, 0, 0, 0.1)"
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }
};