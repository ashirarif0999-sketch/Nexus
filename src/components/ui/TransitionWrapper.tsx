import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import barba from '@barba/core';

interface TransitionWrapperProps {
  children: React.ReactNode;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSplitRef = useRef<HTMLDivElement>(null);
  const rightSplitRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const svgGroupRef = useRef<SVGGElement>(null);
  const isInitialized = useRef(false);
  const [transitionPhase, setTransitionPhase] = useState<'initial' | 'transitioning' | 'complete'>('initial');

  // Inject CSS styles for consistent styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
        .transition-overlay {
            position: fixed;
            top: 0;
            width: 50%;
            height: 100%;
            background: #f3f3f3;
            z-index: 999999;
            pointer-events: none;
            will-change: transform;
            visibility: visible !important;
            opacity: 1 !important;
        }
        #transition-left { left: 0; }
        #transition-right { right: 0; }

        #transition-loader-wrapper {
            position: fixed;
            inset: 0;
            z-index: 9999999;
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            visibility: visible !important;
            opacity: 1;
        }

        .loading-spinner-dot {
            fill: #000000;
            transition: cx 0.5s cubic-bezier(0.3, 1.4, 0.4, 1),
                        cy 0.5s cubic-bezier(0.3, 1.4, 0.4, 1),
                        r 0.5s cubic-bezier(0.3, 1.4, 0.4, 1);
        }

        .loading-spinner-gooey {
            transform-origin: 100px 100px;
            transition: transform 0.5s linear;
        }
    `;
    document.documentElement.appendChild(style);

    // Cleanup on unmount
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // --- EXACT SPINNER LOGIC FROM LoadingSpinner ---
  const runSpinner = () => {
    if (!svgGroupRef.current) return;

    const svgGroup = svgGroupRef.current;
    const spacing = 25;

    function createDot(cx: number, cy: number, r: number) {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", cx.toString());
      dot.setAttribute("cy", cy.toString());
      dot.setAttribute("r", r.toString());
      dot.setAttribute("fill", "black");
      dot.classList.add("loading-spinner-dot");
      svgGroup.appendChild(dot);
      return dot;
    }

    function animateSpinner() {
      // Clear existing dots except center
      svgGroup.querySelectorAll(".loading-spinner-dot").forEach((dot) => {
        if (dot !== svgGroup.querySelector('circle[fill="black"]')) dot.remove();
      });

      // Reset center dot
      const centerDot = svgGroup.querySelector('circle[fill="black"]') as SVGCircleElement;
      if (centerDot) {
        centerDot.setAttribute("cx", "100");
        centerDot.setAttribute("cy", "100");
        centerDot.setAttribute("r", "6");
      }

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
      }, 800); // Reduced from 1000ms

      // Rotate the whole group
      setTimeout(() => {
        svgGroup.style.transform = "rotate(360deg)";
      }, 2000); // Reduced from 2500ms

      // Back to single dot
      setTimeout(() => {
        svgGroup.style.transition = "transform 0.5s linear";
        svgGroup.style.transform = "rotate(0deg)";
        allDots.forEach((dot) => {
          dot.setAttribute("cx", "100");
          dot.setAttribute("cy", "100");
          dot.setAttribute("r", "6");
        });
      }, 2500); // Reduced from 3000ms
    }

    animateSpinner();
  };

  // --- THE SPLIT ANIMATION FUNCTION ---
  const masterTransition = () => {
    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: () => resolve() });

      // 1. Reset state
      gsap.set([leftSplitRef.current, rightSplitRef.current], { yPercent: 0 });
      gsap.set(spinnerRef.current, { display: 'flex', opacity: 1 });
      runSpinner();

      // 2. WAIT 2.5 SECS then FADE
      tl.to(spinnerRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 2.5, // The 2.5s spinner runtime
        ease: "power2.inOut",
        onComplete: () => gsap.set(spinnerRef.current, { display: 'none' })
      })
      // 3. SPLIT: Left goes up first
      .to(leftSplitRef.current, {
        yPercent: -100,
        duration: 1,
        ease: "expo.inOut"
      }, "+=0.1") 
      // 4. SPLIT: Right goes up 0.25s later
      .to(rightSplitRef.current, {
        yPercent: -100,
        duration: 1,
        ease: "expo.inOut"
      }, "-=0.9"); // 1.0 duration minus 0.75 = 0.25s delay after left starts
    });
  };

  useEffect(() => {
    // Prevent double initialization in React Dev Mode
    if (isInitialized.current) return;
    isInitialized.current = true;

    barba.init({
      transitions: [{
        name: 'split-screen',
        async once() {
          setTransitionPhase('transitioning');
          await masterTransition();
          setTransitionPhase('complete');
        },
        async leave() {
          // Bring screens back down to cover current page
          await gsap.to([leftSplitRef.current, rightSplitRef.current], {
            yPercent: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.inOut"
          });
        },
        async enter() {
          setTransitionPhase('transitioning');
          window.scrollTo(0, 0);
          await masterTransition();
          setTransitionPhase('complete');
        }
      }]
    });
  }, []);

  return (
    <div ref={wrapperRef} data-barba="wrapper" className="relative w-full">
      {/* PERSISTENT OVERLAY: Outside the Barba container so it doesn't duplicate */}
      <div id="transition-left" ref={leftSplitRef} className="transition-overlay" />
      <div id="transition-right" ref={rightSplitRef} className="transition-overlay" />

      <div id="transition-loader-wrapper" ref={spinnerRef}>
        <svg viewBox="0 0 200 200" style={{ width: '192px', height: '192px' }}>
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
            <circle className="loading-spinner-dot" cx="100" cy="100" r="6" fill="black" />
          </g>
        </svg>
      </div>

      {/* Barba Container: Always render children immediately */}
      <div ref={containerRef} data-barba="container" className="min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default TransitionWrapper;