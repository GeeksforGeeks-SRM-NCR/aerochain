import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  trigger?: boolean; // If true, uses ScrollTrigger
}

const TextReveal: React.FC<TextRevealProps> = ({ children, className = "", delay = 0, trigger = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const chars = '.reveal-char';

      const animStart = {
        y: 80,
        opacity: 0,
        rotateX: -90,
      };

      const animEnd = {
        y: 0,
        opacity: 1,
        rotateX: 0,
        stagger: 0.02,
        duration: 1,
        ease: "power4.out",
        delay: delay
      };

      if (trigger) {
        gsap.fromTo(chars,
          animStart,
          {
            ...animEnd,
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      } else {
        gsap.fromTo(chars, animStart, animEnd);
      }
    }, containerRef);

    return () => ctx.revert();
  }, [children, delay, trigger]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className} flex flex-wrap justify-center`}>
      {children.split(' ').map((word, wordIndex, array) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split('').map((char, i) => (
            <span
              key={i}
              className="reveal-char inline-block origin-bottom transform-gpu"
              style={{
                opacity: 0 // Initial CSS hide to prevent flash of unstyled content
              }}
            >
              {char}
            </span>
          ))}
          {wordIndex !== array.length - 1 && (
            <span
              className="reveal-char inline-block origin-bottom transform-gpu"
              style={{
                whiteSpace: 'pre',
                opacity: 0
              }}
            >
              {' '}
            </span>
          )}
        </span>
      ))}
    </div>
  );
};

export default TextReveal;