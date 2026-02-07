import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler to catch silent failures
window.addEventListener("error", (e) => {
  document.getElementById("root")!.innerHTML =
    `<div style="padding:2rem;font-family:sans-serif;color:red">
      <h2>App Error</h2>
      <pre style="white-space:pre-wrap">${e.message}\n${e.filename}:${e.lineno}</pre>
    </div>`;
});

window.addEventListener("unhandledrejection", (e) => {
  document.getElementById("root")!.innerHTML =
    `<div style="padding:2rem;font-family:sans-serif;color:red">
      <h2>App Error (Promise)</h2>
      <pre style="white-space:pre-wrap">${e.reason}</pre>
    </div>`;
});

try {
  const root = document.getElementById("root");
  if (!root) {
    document.body.innerHTML = '<div style="padding:2rem;color:red">Root element not found</div>';
  } else {
    createRoot(root).render(<App />);
  }
} catch (err) {
  document.getElementById("root")!.innerHTML =
    `<div style="padding:2rem;font-family:sans-serif;color:red">
      <h2>Render Error</h2>
      <pre style="white-space:pre-wrap">${err}</pre>
    </div>`;
}
