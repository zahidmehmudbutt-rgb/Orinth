import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry (only in production with DSN configured)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// Track Web Vitals
if (typeof window !== "undefined") {
  import("web-vitals").then(({ onCLS, onINP, onLCP, onTTFB }) => {
    const reportVital = (metric: { name: string; value: number; rating: string }) => {
      if (import.meta.env.DEV) {
        console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
      }
    };
    onCLS(reportVital);
    onINP(reportVital);
    onLCP(reportVital);
    onTTFB(reportVital);
  });
}
