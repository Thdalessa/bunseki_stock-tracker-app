"use client";
import { useCallback, useRef, useEffect } from "react";

export function useDebounce(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestCallbackRef = useRef(callback);

  // Always keep the latest callback in the ref
  useEffect(() => {
    latestCallbackRef.current = callback;
  }, [callback]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Memoize debounced function by delay only
  const debouncedFn = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      latestCallbackRef.current();
    }, delay);
  }, [delay]);

  return debouncedFn;
}
