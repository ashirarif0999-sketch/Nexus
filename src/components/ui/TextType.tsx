'use client';

import { useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import './TextType.css';

interface TextTypeProps {
  text: string | string[];
  as?: keyof JSX.IntrinsicElements;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  textColors?: string[];
  textGradient?: string; // Linear gradient CSS for text (e.g., 'linear-gradient(90deg, #ff0000, #0000ff)')
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
  [key: string]: any;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  as: Component = 'span',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  textGradient,
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorAnimationRef = useRef<gsap.core.Tween | null>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return 'inherit';
    const color = textColors[currentTextIndex % textColors.length];
    // Check if the color is a gradient string
    if (typeof color === 'string' && color.includes('linear-gradient')) {
      return color;
    }
    return color;
  };

  // Check if current text color is a gradient
  const isCurrentColorGradient = () => {
    if (textColors.length === 0) return false;
    const color = textColors[currentTextIndex % textColors.length];
    return typeof color === 'string' && color.includes('linear-gradient');
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const isCurrentlyVisible = entry.isIntersecting;
          setIsVisible(isCurrentlyVisible);

          // Pause/resume cursor animation based on visibility
          if (cursorAnimationRef.current) {
            if (isCurrentlyVisible) {
              cursorAnimationRef.current.resume();
            } else {
              cursorAnimationRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      // Kill any existing animation
      if (cursorAnimationRef.current) {
        cursorAnimationRef.current.kill();
      }

      gsap.set(cursorRef.current, { opacity: 1 });
      cursorAnimationRef.current = gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });

      // If component starts hidden, pause the animation initially
      if (startOnVisible && !isVisible) {
        cursorAnimationRef.current.pause();
      }
    }

    // Cleanup function
    return () => {
      if (cursorAnimationRef.current) {
        cursorAnimationRef.current.kill();
        cursorAnimationRef.current = null;
      }
    };
  }, [showCursor, cursorBlinkDuration, startOnVisible, isVisible]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (cursorAnimationRef.current) {
        cursorAnimationRef.current.kill();
        cursorAnimationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    // Guard against empty textArray
    if (!textArray || textArray.length === 0) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const currentText = textArray[currentTextIndex];
    
    // Guard against undefined currentText
    if (!currentText) {
      return;
    }
    
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          if (onSentenceComplete && textArray[currentTextIndex]) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          }

          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText(prev => prev + processedText[currentCharIndex]);
              setCurrentCharIndex(prev => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete
  ]);

  const shouldHideCursor =
    textArray[currentTextIndex] && hideCursorWhileTyping && (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  // Determine if we should use gradient (textGradient takes precedence over textColors)
  const useGradient = !!textGradient;
  const currentColor = getCurrentTextColor();
  const colorIsGradient = isCurrentColorGradient();
  const backgroundValue = textGradient || (textColors.length > 0 ? currentColor : undefined);

  const textStyle = useGradient || colorIsGradient ? {
    background: backgroundValue,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent'
  } : {
    color: getCurrentTextColor() || 'inherit'
  };

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `text-type ${className}`,
      ...props
    },
    <span 
      className="text-type__content" 
      style={textStyle}
    >
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`text-type__cursor ${cursorClassName} ${shouldHideCursor ? 'text-type__cursor--hidden' : ''}`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default TextType;
