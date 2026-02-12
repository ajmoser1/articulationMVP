import { useEffect, useState } from "react";

interface UseCountUpOptions {
  durationMs?: number;
  delayMs?: number;
}

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { durationMs = 800, delayMs = 0 } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let timeoutId = 0;
    const startAt = performance.now() + delayMs;

    const animate = (now: number) => {
      if (now < startAt) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      const progress = Math.min(1, (now - startAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    timeoutId = window.setTimeout(() => {
      rafId = requestAnimationFrame(animate);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, durationMs, delayMs]);

  return value;
}
