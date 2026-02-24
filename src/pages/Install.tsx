import { Share, Plus, EllipsisVertical, Download, Smartphone, Monitor, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export default function Install() {
  const navigate = useNavigate();
  const ios = isIOS();
  const android = isAndroid();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xs uppercase tracking-[0.15em] font-normal">Install HUME Ops</h1>
      </div>

      <div className="px-4 py-8 max-w-lg mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-border">
            <Smartphone className="h-8 w-8 text-foreground" />
          </div>
          <h2 className="text-lg font-normal tracking-wide">
            Add HUME Ops to your Home Screen
          </h2>
          <p className="text-sm text-muted-foreground tracking-wide max-w-xs mx-auto">
            Install for quick access, faster loading, and a full-screen experience — no app store needed.
          </p>
        </div>

        {/* iOS Instructions */}
        <Card className={cn(!ios && !android && "block", ios && "block", android && "hidden")}>
          <CardContent className="space-y-0 pt-0">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">iPhone / iPad — Safari</span>
            </div>
            <ol className="space-y-5 pt-5">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-medium">1</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Look for the <Share className="inline h-4 w-4" /> icon in Safari's toolbar.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-medium">2</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Scroll down and tap "Add to Home Screen"</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Look for the <Plus className="inline h-4 w-4" /> icon in the share sheet.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-medium">3</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Tap "Add" to confirm</p>
                  <p className="text-xs text-muted-foreground">
                    HUME Ops will appear on your home screen as an app.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Android Instructions */}
        <Card className={cn(!ios && !android && "block", android && "block", ios && "hidden")}>
          <CardContent className="space-y-0 pt-0">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Android — Chrome</span>
            </div>
            <ol className="space-y-5 pt-5">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-medium">1</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Tap the menu button</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Look for the <EllipsisVertical className="inline h-4 w-4" /> icon in Chrome's top-right corner.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-medium">2</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Tap "Install app" or "Add to Home screen"</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Look for the <Download className="inline h-4 w-4" /> icon in the menu.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-medium">3</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Tap "Install" to confirm</p>
                  <p className="text-xs text-muted-foreground">
                    HUME Ops will be added to your home screen and app drawer.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Note */}
        <p className="text-center text-xs text-muted-foreground tracking-wide">
          Must use <strong>Safari</strong> on iOS or <strong>Chrome</strong> on Android.
        </p>
      </div>
    </div>
  );
}
