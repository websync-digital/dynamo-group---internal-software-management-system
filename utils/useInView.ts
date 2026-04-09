import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * A lightweight alternative to react-intersection-observer 
 * built for high-performance sub-second data scrolling.
 */
export function useInView(options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  const callback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setInView(entry.isIntersecting);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(callback, options);
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [callback, options]);

  return { ref, inView };
}
