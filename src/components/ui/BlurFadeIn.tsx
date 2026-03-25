'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface BlurFadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  blurStrength?: string;
}

export const BlurFadeIn: React.FC<BlurFadeInProps> = ({
  children,
  duration = 0.98,
  delay = 0,
  className = '',
  blurStrength = '10px'
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsVisible(true);
    
    if (!elementRef.current) return;

    // Create GSAP animation
    gsap.fromTo(
      elementRef.current,
      {
        opacity: 0,
        filter: `blur(${blurStrength})`
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: duration,
        delay: delay,
        ease: 'power2.out'
      }
    );
  }, [duration, delay, blurStrength]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ opacity: isVisible ? undefined : 0 }}
    >
      {children}
    </div>
  );
};

export default BlurFadeIn;
