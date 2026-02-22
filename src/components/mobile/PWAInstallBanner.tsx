import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Share, Plus, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "hume_pwa_install_dismissed";
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
}

export function PWAInstallBanner() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (!isMobile || isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (!isNaN(ts) && Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (isIOS()) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [isMobile]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      const { outcome } = await deferredPrompt.prompt();
      if (outcome === "accepted") {
        setVisible(false);
      }
    } else {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

  const handleIosShowHow = useCallback(() => {
    setShowIosModal(true);
  }, []);

  if (!visible) return null;

  const ios = isIOS();

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm border-b",
          "bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100",
          "border-sky-200 dark:border-sky-800",
          "animate-in slide-in-from-top duration-200"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-200 dark:bg-sky-800">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {ios ? "Add HUME Ops to your Home Screen" : "Install HUME Ops for quick access and offline support"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {ios ? (
            <>
              <Button variant="outline" size="sm" onClick={handleIosShowHow} className="text-xs">
                Show me how
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismiss} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={dismiss} className="text-xs">
                Not now
              </Button>
              <Button size="sm" onClick={handleInstall} className="text-xs">
                Install
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={showIosModal} onOpenChange={setShowIosModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
          </DialogHeader>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Share className="h-5 w-5 shrink-0 mt-0.5" />
              <span>Tap the <strong>Share</strong> button in Safari&apos;s toolbar (bottom or top).</span>
            </li>
            <li className="flex items-start gap-2">
              <Plus className="h-5 w-5 shrink-0 mt-0.5" />
              <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
            </li>
            <li>
              <span>Tap <strong>Add</strong> to confirm.</span>
            </li>
          </ol>
          <Button onClick={() => setShowIosModal(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
