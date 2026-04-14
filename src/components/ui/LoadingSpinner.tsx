import React, { useEffect, useRef, useState } from 'react';

interface LoadingSpinnerProps {
  onComplete?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const svgGroupRef = useRef<SVGGElement>(null);
  const centerDotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    // Show loading spinner for 5 seconds, then fade out
    const timer = setTimeout(() => {
      setIsFading(true);
      // Wait for fade animation to complete before hiding
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 500); // Match the CSS transition duration
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (!isVisible) return;

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

      // Infinite repeat if still visible
      if (isVisible) {
        setTimeout(() => {
          animateSpinner();
        }, 4000);
      }
    }

    animateSpinner();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`loading-spinner-container flex items-center justify-center min-h-screen bg-aliceblue transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
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