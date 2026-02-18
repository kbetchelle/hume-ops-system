import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { log } from "./lib/logger";

// Register service worker for PWA functionality
registerServiceWorker({
  onUpdate: (registration) => {
    // Notify user about update availability
    log("[App] New update available");
    // Could dispatch a custom event or use a toast notification
    window.dispatchEvent(new CustomEvent("sw-update-available", { detail: registration }));
  },
  onOfflineReady: () => {
    log("[App] App ready for offline use");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
