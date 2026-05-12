import { useEffect, useRef, useState } from 'react';

// Lightweight scroll-reveal hook.
// Adds `.gs-revealed` class to the element once it enters the viewport.
// Respects prefers-reduced-motion.
export function useReveal({ threshold = 0.12, rootMargin = '0px 0px -80px 0px' } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setShown(true);
          io.unobserve(e.target);
        }
      }
    }, { threshold, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, revealed: shown };
}
