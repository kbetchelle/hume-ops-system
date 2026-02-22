import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

interface BiometricLoginButtonProps {
  onSuccess: () => void;
}

export function BiometricLoginButton({ onSuccess }: BiometricLoginButtonProps) {
  const { authenticate, hasStoredCredential, isSupported } = useWebAuthn();
  const { signIn } = useAuthContext();
  const [loading, setLoading] = useState(false);

  if (!isSupported || !hasStoredCredential()) return null;

  const handleBiometric = async () => {
    setLoading(true);
    try {
      const result = await authenticate();
      if (result.error) {
        toast.error("Biometric login failed. Please use your password.");
        return;
      }
      if (result.redirectUrl) {
        return;
      }
      if (result.userId) {
        onSuccess();
      }
    } catch {
      toast.error("Biometric login failed. Please use your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleBiometric}
      disabled={loading}
    >
      <Fingerprint className="h-4 w-4" />
      {loading ? "Signing in…" : "Sign in with Face ID / Fingerprint"}
    </Button>
  );
}
