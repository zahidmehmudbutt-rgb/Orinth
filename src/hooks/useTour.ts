import { useRef, useCallback, useState, useEffect } from "react";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/onboarding/tour-styles.css";

export function useTour(role: string, steps: DriveStep[]) {
  const driverRef = useRef<Driver | null>(null);
  const storageKey = `tour-completed-${role}`;
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });

  const startTour = useCallback(() => {
    // Filter out steps whose elements aren't in the DOM
    const availableSteps = steps.filter((step) => {
      if (!step.element) return true; // steps without element (e.g. intro) always show
      const el = document.querySelector(step.element as string);
      return el !== null;
    });

    if (availableSteps.length === 0) return;

    // Clean up previous instance
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "driver-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      steps: availableSteps,
      onDestroyed: () => {
        localStorage.setItem(storageKey, "true");
        setHasCompletedTour(true);
      },
    });

    // Wait for DOM to be painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        driverRef.current?.drive();
      });
    });
  }, [steps, storageKey]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasCompletedTour(false);
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  return { startTour, hasCompletedTour, resetTour };
}
