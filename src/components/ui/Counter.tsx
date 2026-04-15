import React, { useState, useEffect, useRef } from 'react';

interface CounterProps {
  end: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const Counter: React.FC<CounterProps> = ({
  end,
  duration = 2000,
  delay = 5000,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            if (delay > 0) {
              setTimeout(() => animateValue(), delay);
            } else {
              animateValue();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const animateValue = () => {
    const startTime = Date.now();
    const startValue = 0;
    const endValue = end;

    const updateCount = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      // For decimal values, show 1 decimal place; for integers, show no decimals
      const displayValue = endValue < 10 ? parseFloat(currentValue.toFixed(1)) : Math.floor(currentValue);
      setCount(displayValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        // For decimal values, show 1 decimal place; for integers, show no decimals
        setCount(endValue < 10 ? parseFloat(endValue.toFixed(1)) : endValue);
      }
    };

    requestAnimationFrame(updateCount);
  };

  return (
    <div ref={elementRef} className={`counter-component ${className}`}>
      <span className="counter-value">
        {prefix}{count.toLocaleString()}{suffix}
      </span>
    </div>
  );
};

// Export as default for standalone use
export default Counter;