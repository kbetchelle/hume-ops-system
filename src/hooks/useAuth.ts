import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Check whether the user chose "session-only" login and this is a new
 * browser session (i.e. they closed and reopened the browser).
 * On mobile we always persist (hume_mobile_session), so never sign out for session-only.
 */
function shouldSignOutSessionOnlyUser(): boolean {
  if (localStorage.getItem("hume_mobile_session") === "true") return false;
  const isSessionOnly = localStorage.getItem("hume_stay_signed_in") === "false";
  const hadSessionMarker = sessionStorage.getItem("hume_session_only") === "true";
  return isSessionOnly && !hadSessionMarker;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session first, then set up the listener so we
    // don't miss events that fire between listener setup and getSession.
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (session && shouldSignOutSessionOnlyUser()) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;

        if (session && shouldSignOutSessionOnlyUser()) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    sessionStorage.setItem("hume_explicit_signout", "1");
    sessionStorage.removeItem("hume_session_only");
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!session,
  };
}
