import { useState, useCallback, useRef } from "react";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000; // 2 seconds
const MAX_DELAY_MS = 60000; // 60 seconds

interface RateLimitState {
  attempts: number;
  lockedUntil: number | null;
}

/**
 * Hook for client-side login rate limiting with progressive delay.
 * After MAX_ATTEMPTS failed attempts, enforces exponential backoff.
 */
export function useLoginRateLimit() {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const stateRef = useRef<RateLimitState>({ attempts: 0, lockedUntil: null });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = remainingSeconds > 0;

  const startCountdown = useCallback((lockUntil: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const update = () => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setRemainingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemainingSeconds(remaining);
      }
    };

    update();
    timerRef.current = setInterval(update, 1000);
  }, []);

  const recordFailure = useCallback(() => {
    const state = stateRef.current;
    state.attempts += 1;

    if (state.attempts >= MAX_ATTEMPTS) {
      const delay = Math.min(
        BASE_DELAY_MS * Math.pow(2, state.attempts - MAX_ATTEMPTS),
        MAX_DELAY_MS
      );
      const lockUntil = Date.now() + delay;
      state.lockedUntil = lockUntil;
      startCountdown(lockUntil);
    }
  }, [startCountdown]);

  const recordSuccess = useCallback(() => {
    stateRef.current = { attempts: 0, lockedUntil: null };
    setRemainingSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const checkLocked = useCallback((): boolean => {
    const state = stateRef.current;
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      return true;
    }
    return false;
  }, []);

  return {
    isLocked,
    remainingSeconds,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - stateRef.current.attempts),
    recordFailure,
    recordSuccess,
    checkLocked,
  };
}
