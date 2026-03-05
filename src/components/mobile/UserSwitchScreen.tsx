"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut } from "lucide-react";
import humeLogo from "@/assets/hume-logo.png";

export interface UserSwitchScreenProps {
  onSignIn: (email: string, password: string) => Promise<{ error: unknown; userId?: string }>;
  onSignOut: () => Promise<{ error: unknown }>;
  previousUserId?: string | null;
  onSwitchedUser?: (newUserId: string) => Promise<void>;
  message?: string;
  sessionExpired?: boolean;
}

export function UserSwitchScreen({
  onSignIn,
  onSignOut,
  previousUserId,
  onSwitchedUser,
  message,
  sessionExpired,
}: UserSwitchScreenProps) {
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
      const { error: err, userId: newUserId } = await onSignIn(email.trim().toLowerCase(), password);
      if (err) {
        setError(err instanceof Error ? err.message : "Invalid email or password");
        return;
      }
      if (onSwitchedUser && newUserId && previousUserId && newUserId !== previousUserId) {
        await clearOfflineDataForPreviousUser();
        await onSwitchedUser(newUserId);
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
        <div className="flex justify-center">
          <img src={humeLogo} alt="HUME" className="h-16 w-auto object-contain" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {sessionExpired ? "Session expired" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {message ??
              (sessionExpired
                ? "Sign in to continue."
                : "Sign in with another account or the same account to continue.")}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="switch-email">Email</Label>
            <Input
              id="switch-email"
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
            <Label htmlFor="switch-password">Password</Label>
            <Input
              id="switch-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-base min-h-[44px]"
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
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

async function clearOfflineDataForPreviousUser(): Promise<void> {
  try {
    const { getOfflineBootstrapDb } = await import("@/lib/offlineBootstrapDb");
    const db = await getOfflineBootstrapDb();
    await db.clear("data");
  } catch {
    // Non-fatal
  }
}
