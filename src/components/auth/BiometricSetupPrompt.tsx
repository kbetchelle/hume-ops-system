import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface BiometricSetupPromptProps {
  onSkip: () => void;
}

export function BiometricSetupPrompt({ onSkip }: BiometricSetupPromptProps) {
  const { register, isSupported } = useWebAuthn();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  if (!isSupported) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const ok = await register();
      if (ok) {
        toast.success("Biometric login enabled");
        setOpen(false);
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

  const handleSkip = () => {
    setOpen(false);
    onSkip();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleSkip(); }}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Fingerprint className="h-8 w-8 text-muted-foreground" />
          </div>
          <DrawerTitle className="text-sm uppercase tracking-widest font-normal">
            Enable Face ID / Fingerprint
          </DrawerTitle>
          <DrawerDescription>
            Sign in faster next time with your device biometrics.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex-row justify-center gap-3 pb-8">
          <Button onClick={handleEnable} disabled={loading} className="min-w-[120px]">
            {loading ? "…" : "Enable"}
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="min-w-[120px]">
            Skip
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
