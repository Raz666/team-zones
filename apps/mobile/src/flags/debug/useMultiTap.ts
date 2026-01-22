import { useCallback, useEffect, useRef } from 'react';

type MultiTapOptions = {
  taps: number;
  windowMs: number;
  onTrigger: () => void;
};

export function useMultiTap({ taps, windowMs, onTrigger }: MultiTapOptions) {
  const tapTimesRef = useRef<number[]>([]);
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  return useCallback(() => {
    const now = Date.now();
    const recent = tapTimesRef.current.filter((time) => now - time <= windowMs);
    recent.push(now);
    tapTimesRef.current = recent;

    if (recent.length >= taps) {
      tapTimesRef.current = [];
      onTriggerRef.current();
    }
  }, [taps, windowMs]);
}
