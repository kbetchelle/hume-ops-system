import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";

// Register service worker for PWA functionality
registerServiceWorker({
  onUpdate: (registration) => {
    // Notify user about update availability
    console.log('[App] New update available');
    // Could dispatch a custom event or use a toast notification
    window.dispatchEvent(new CustomEvent('sw-update-available', { detail: registration }));
  },
  onOfflineReady: () => {
    console.log('[App] App ready for offline use');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
