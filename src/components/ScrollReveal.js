import React, { useEffect, useRef, useState } from 'react';

const ScrollReveal = ({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
  as: Component = 'div',
  ...props
}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold
      }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return (
    <Component
      ref={elementRef}
      className={`reveal ${isVisible ? 'visible' : ''} ${className}`}
      style={{ '--d': `${delay}s`, ...props.style }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default ScrollReveal;
