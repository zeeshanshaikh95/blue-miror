import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { cn } from '@/utils/cn';

/** Thin gold reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max > 0 ? Math.min(100, (root.scrollTop / max) * 100) : 0);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className="h-full bg-brand-gold transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/** Floating back-to-top control that appears once the visitor scrolls down. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 700);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed right-5 bottom-24 z-40 hidden size-11 place-items-center rounded-full border border-brand-gold/60 bg-brand-ivory/90 text-brand-indigo shadow-lg backdrop-blur transition-all duration-300 hover:bg-brand-gold hover:text-brand-indigo-deep lg:grid',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp aria-hidden="true" size={18} strokeWidth={1.6} />
    </button>
  );
}
