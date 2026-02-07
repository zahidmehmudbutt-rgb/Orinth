import { useCallback, useEffect, useRef, useState } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/onboarding/tour-styles.css";
import { tourStepsByRole, type TourRole } from "@/components/onboarding/tour-configs";

const TOUR_STORAGE_PREFIX = "tour-completed-";

function getTourStorageKey(role: TourRole): string {
  return `${TOUR_STORAGE_PREFIX}${role}`;
}

export function useTour(role: TourRole) {
  const driverRef = useRef<Driver | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    return localStorage.getItem(getTourStorageKey(role)) === "true";
  });

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  const startTour = useCallback(() => {
    driverRef.current?.destroy();

    const steps = tourStepsByRole[role]();

    const validSteps = steps.filter((step) => {
      if (!step.element) return true;
      return document.querySelector(step.element as string) !== null;
    });

    if (validSteps.length === 0) return;

    const driverInstance = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: validSteps,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done!",
      progressText: "{{current}} of {{total}}",
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: "school-tour-popover",
      onDestroyed: () => {
        localStorage.setItem(getTourStorageKey(role), "true");
        setHasCompletedTour(true);
      },
    });

    driverRef.current = driverInstance;

    requestAnimationFrame(() => {
      driverInstance.drive();
    });
  }, [role]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(getTourStorageKey(role));
    setHasCompletedTour(false);
  }, [role]);

  return { startTour, resetTour, hasCompletedTour };
}
