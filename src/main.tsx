import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// Debug: mark that JS module executed
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__APP_DEBUG = {
    ...(window as unknown as Record<string, Record<string, unknown>>).__APP_DEBUG,
    jsStarted: true,
  };
  console.log("[App] main.tsx executing, mounting React...");
}

try {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log("[App] React render called successfully");
} catch (err) {
  console.error("[App] Fatal error mounting React:", err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding:2rem;color:red;font-family:system-ui"><h2>Fatal Error</h2><pre>${err}</pre></div>`;
  }
}
