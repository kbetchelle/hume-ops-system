"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut } from "lucide-react";

const SHARED_DEVICE_KEY = "hume_shared_device";

export function isSharedDevice(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SHARED_DEVICE_KEY) === "true";
}

export function setSharedDevice(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(SHARED_DEVICE_KEY, "true");
  } else {
    localStorage.removeItem(SHARED_DEVICE_KEY);
  }
}

interface LockScreenProps {
  onUnlock: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignOut: () => Promise<{ error: unknown }>;
}

export function LockScreen({ onUnlock, onSignOut }: LockScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await onUnlock(email.trim(), password);
      if (err) {
        setError(err instanceof Error ? err.message : "Invalid email or password");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await onSignOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Switch User</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with another account or the same account to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lock-email">Email</Label>
            <Input
              id="lock-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-base min-h-[44px]"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lock-password">Password</Label>
            <Input
              id="lock-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-base min-h-[44px]"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full min-h-[44px]"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        <div className="text-center">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out completely
          </button>
        </div>
      </div>
    </div>
  );
}
