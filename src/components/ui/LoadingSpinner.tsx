import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface LoadingSpinnerProps {
  onComplete?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ onComplete }) => {
  const [transitionPhase, setTransitionPhase] = useState<'loading' | 'fading' | 'splitting' | 'done'>('loading');
  const svgGroupRef = useRef<SVGGElement>(null);
  const centerDotRef = useRef<SVGCircleElement>(null);
  const splitLeftRef = useRef<HTMLDivElement>(null);
  const splitRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show loading spinner for 3 seconds, then start fading
    const timer = setTimeout(() => {
      setTransitionPhase('fading');
      // Wait for fade animation to complete before starting split
      setTimeout(() => {
        setTransitionPhase('splitting');
      }, 500); // Match the CSS transition duration
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (transitionPhase !== 'loading') return;

    const svgGroup = svgGroupRef.current;
    if (!svgGroup) return;

    let centerDot = centerDotRef.current;
    if (!centerDot) return;

    const spacing = 25;

    function createDot(cx: number, cy: number, r: number) {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", cx.toString());
      dot.setAttribute("cy", cy.toString());
      dot.setAttribute("r", r.toString());
      dot.classList.add("loading-spinner-dot");
      svgGroup.appendChild(dot);
      return dot;
    }

    function animateSpinner() {
      // Clear existing dots except center
      svgGroup.querySelectorAll(".loading-spinner-dot").forEach((dot) => {
        if (dot !== centerDot) dot.remove();
      });

      // Reset center dot
      centerDot.setAttribute("cx", "100");
      centerDot.setAttribute("cy", "100");
      centerDot.setAttribute("r", "6");

      const allDots: SVGCircleElement[] = [];

      // Cardinal directions
      const first4 = [
        { cx: 100, cy: 100 - spacing },
        { cx: 100, cy: 100 + spacing },
        { cx: 100 - spacing, cy: 100 },
        { cx: 100 + spacing, cy: 100 }
      ];

      first4.forEach((pos) => {
        const dot = createDot(100, 100, 6);
        allDots.push(dot);
        const midX = (100 + pos.cx) / 2;
        const midY = (100 + pos.cy) / 2;
        setTimeout(() => {
          dot.setAttribute("r", "8");
          dot.setAttribute("cx", midX.toString());
          dot.setAttribute("cy", midY.toString());
        }, 50);
        setTimeout(() => {
          dot.setAttribute("r", "6");
          dot.setAttribute("cx", pos.cx.toString());
          dot.setAttribute("cy", pos.cy.toString());
        }, 500);
      });

      // Diagonals
      setTimeout(() => {
        const diagSpacing = spacing / Math.sqrt(2);
        const diagonal = [
          { cx: 100 - diagSpacing, cy: 100 - diagSpacing },
          { cx: 100 + diagSpacing, cy: 100 - diagSpacing },
          { cx: 100 - diagSpacing, cy: 100 + diagSpacing },
          { cx: 100 + diagSpacing, cy: 100 + diagSpacing }
        ];
        diagonal.forEach((pos) => {
          const dot = createDot(100, 100, 6);
          allDots.push(dot);
          const midX = (100 + pos.cx) / 2;
          const midY = (100 + pos.cy) / 2;
          setTimeout(() => {
            dot.setAttribute("r", "8");
            dot.setAttribute("cx", midX.toString());
            dot.setAttribute("cy", midY.toString());
          }, 50);
          setTimeout(() => {
            dot.setAttribute("r", "6");
            dot.setAttribute("cx", pos.cx.toString());
            dot.setAttribute("cy", pos.cy.toString());
          }, 500);
        });
      }, 1000);

      // Rotate the whole group
      setTimeout(() => {
        svgGroup.style.transform = "rotate(360deg)";
      }, 2500);

      // Back to single dot
      setTimeout(() => {
        svgGroup.style.transition = "transform 0.5s linear";
        svgGroup.style.transform = "rotate(0deg)";
        allDots.forEach((dot) => {
          dot.setAttribute("cx", "100");
          dot.setAttribute("cy", "100");
          dot.setAttribute("r", "6");
        });
      }, 3000);

      // Infinite repeat if still loading
      if (transitionPhase === 'loading') {
        setTimeout(() => {
          animateSpinner();
        }, 4000);
      }
    }

    animateSpinner();
  }, [transitionPhase === 'loading']);

  useEffect(() => {
    if (transitionPhase !== 'splitting') return;

    const splitLeft = splitLeftRef.current;
    const splitRight = splitRightRef.current;
    if (!splitLeft || !splitRight) return;

    // Animate the split
    gsap.to(splitLeft, {
      top: '-100%',
      duration: 0.8,
      ease: 'power2.inOut'
    });
    gsap.to(splitRight, {
      top: '-100%',
      duration: 0.8,
      ease: 'power2.inOut',
      delay: 0.25,
      onComplete: () => {
        setTransitionPhase('done');
        onComplete?.();
      }
    });
  }, [transitionPhase, onComplete]);

  if (transitionPhase === 'done') return null;

  return (
    <div className={`loading-spinner-container flex items-center justify-center min-h-screen bg-aliceblue transition-opacity duration-500 ${transitionPhase === 'fading' ? 'opacity-0' : 'opacity-100'} relative overflow-hidden`}>
      <img src="/images/logo.avif" alt="Logo" className="absolute top-4 left-4 w-16 h-auto z-10" />
      <div
        ref={splitLeftRef}
        className="absolute top-0 left-0 w-1/2 h-full bg-aliceblue z-20"
        style={{ left: '0%' }}
      />
      <div
        ref={splitRightRef}
        className="absolute top-0 right-0 w-1/2 h-full bg-aliceblue z-20"
        style={{ right: '0%' }}
      />
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 20 -10" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
        <g id="gooey" ref={svgGroupRef} filter="url(#goo)" className="loading-spinner-gooey">
          <circle ref={centerDotRef} className="loading-spinner-dot" cx="100" cy="100" r="6" />
        </g>
      </svg>
    </div>
  );
};

export default LoadingSpinner;