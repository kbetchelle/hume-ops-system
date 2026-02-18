import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("[NotFound]");

const OAUTH_RELOAD_KEY = "hume_oauth_reload_attempts";
const MAX_OAUTH_RELOADS = 1;

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // OAuth callback must be handled by the native auth bridge, not React Router
    if (location.pathname.startsWith("/~oauth")) {
      const attempts = parseInt(sessionStorage.getItem(OAUTH_RELOAD_KEY) ?? "0", 10);
      if (attempts >= MAX_OAUTH_RELOADS) {
        // Auth bridge did not take over; avoid infinite reload loop
        sessionStorage.removeItem(OAUTH_RELOAD_KEY);
        return;
      }
      sessionStorage.setItem(OAUTH_RELOAD_KEY, String(attempts + 1));
      window.location.reload();
      return;
    }
    sessionStorage.removeItem(OAUTH_RELOAD_KEY);
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Don't render 404 UI for OAuth callback
  if (location.pathname.startsWith('/~oauth')) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
