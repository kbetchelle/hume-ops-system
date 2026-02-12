import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NotFound.tsx:7',message:'NotFound rendered',data:{pathname:location.pathname,search:location.search,fullHref:window.location.href,startsWithOAuth:location.pathname.startsWith('/~oauth')},timestamp:Date.now(),hypothesisId:'H1,H2'})}).catch(()=>{});
    // #endregion
    // OAuth callback must be handled by the native auth bridge, not React Router
    if (location.pathname.startsWith('/~oauth')) {
      window.location.href = window.location.href;
      return;
    }
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
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
