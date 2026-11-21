import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger the animation by a few milliseconds. */
  delay?: number;
};

/**
 * Fades content up as it enters the viewport. Falls back to visible content
 * when IntersectionObserver is unavailable or motion is reduced.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Browsers without IntersectionObserver get the content immediately.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
