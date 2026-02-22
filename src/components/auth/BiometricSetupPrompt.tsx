import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { toast } from "sonner";

interface BiometricSetupPromptProps {
  onSkip: () => void;
}

export function BiometricSetupPrompt({ onSkip }: BiometricSetupPromptProps) {
  const { register, isSupported } = useWebAuthn();
  const [loading, setLoading] = useState(false);

  if (!isSupported) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const ok = await register();
      if (ok) {
        toast.success("Biometric login enabled");
        onSkip();
      } else {
        toast.error("Could not enable. Use password to sign in.");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Fingerprint className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium text-sm">Enable Face ID / fingerprint login?</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Sign in faster next time with your device biometrics.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleEnable} disabled={loading}>
          {loading ? "…" : "Enable"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
