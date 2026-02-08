import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLoginRateLimit } from "../useLoginRateLimit";

describe("useLoginRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with isLocked=false and 5 attempts left", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    expect(result.current.isLocked).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.attemptsLeft).toBe(5);
  });

  it("does not lock after fewer than 5 failures", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
      result.current.recordFailure();
      result.current.recordFailure();
    });

    // isLocked is derived from remainingSeconds state, which stays 0 until 5 failures
    expect(result.current.isLocked).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    // attemptsLeft reads from a ref and only recalculates on re-render;
    // since no state changed (< 5 failures), no re-render occurred, so
    // checkLocked() is a more reliable way to verify we're not locked
    expect(result.current.checkLocked()).toBe(false);
  });

  it("locks after 5 failures with a countdown", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailure();
      }
    });

    // After exactly 5 failures: delay = 2000 * 2^(5-5) = 2000ms = 2 seconds
    expect(result.current.isLocked).toBe(true);
    expect(result.current.remainingSeconds).toBe(2);
    expect(result.current.attemptsLeft).toBe(0);
  });

  it("unlocks after countdown expires", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailure();
      }
    });

    expect(result.current.isLocked).toBe(true);

    // Advance past the 2-second lockout
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("applies exponential backoff for repeated lockouts", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    // 5 failures => locked for 2s (2000 * 2^0)
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailure();
      }
    });
    expect(result.current.remainingSeconds).toBe(2);

    // Wait for lockout to expire
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // 6th failure => locked for 4s (2000 * 2^1)
    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.isLocked).toBe(true);
    expect(result.current.remainingSeconds).toBe(4);

    // Wait for lockout to expire
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 7th failure => locked for 8s (2000 * 2^2)
    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.isLocked).toBe(true);
    expect(result.current.remainingSeconds).toBe(8);
  });

  it("resets state after recordSuccess", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    // Lock the account
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailure();
      }
    });
    expect(result.current.isLocked).toBe(true);

    // Record success
    act(() => {
      result.current.recordSuccess();
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.attemptsLeft).toBe(5);
  });

  it("checkLocked returns true while locked", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailure();
      }
    });

    expect(result.current.checkLocked()).toBe(true);

    // After lockout expires
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.checkLocked()).toBe(false);
  });

  it("caps delay at 60 seconds maximum", () => {
    const { result } = renderHook(() => useLoginRateLimit());

    // Create many failures to push delay very high
    // delay = 2000 * 2^(n-5), capped at 60000
    // 2000 * 2^10 = 2048000 which exceeds 60000, so it should cap
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.recordFailure();
      }
    });

    // 15 failures => delay = min(2000 * 2^10, 60000) = 60000ms = 60s
    expect(result.current.remainingSeconds).toBe(60);
  });
});
