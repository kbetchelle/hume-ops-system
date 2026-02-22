import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LockScreen } from "@/components/auth/LockScreen";
import { UserSwitchScreen } from "@/components/mobile/UserSwitchScreen";

const EXPLICIT_SIGNOUT_KEY = "hume_explicit_signout";

type AuthContextType = ReturnType<typeof useAuth> & {
  isLocked: boolean;
  lockSession: () => void;
  unlockSession: (email: string, password: string) => Promise<{ error: unknown }>;
  sessionExpired: boolean;
  showUserSwitch: boolean;
  openUserSwitchScreen: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showUserSwitch, setShowUserSwitch] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  if (auth.user?.id) {
    lastUserIdRef.current = auth.user.id;
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionExpired(false);
        return;
      }
      const explicit = sessionStorage.getItem(EXPLICIT_SIGNOUT_KEY) === "1";
      if (explicit) {
        sessionStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
        return;
      }
      if (lastUserIdRef.current) {
        setSessionExpired(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const lockSession = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockSession = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await auth.signIn(email, password);
      if (!error) {
        setIsLocked(false);
      }
      return { error };
    },
    [auth]
  );

  const handleSessionExpiredSignIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await auth.signIn(email, password);
      if (error) {
        return { error };
      }
      setSessionExpired(false);
      return { error: undefined, userId: data?.user?.id };
    },
    [auth]
  );

  const handleSessionExpiredSignOut = useCallback(async () => {
    sessionStorage.setItem(EXPLICIT_SIGNOUT_KEY, "1");
    const result = await auth.signOut();
    setSessionExpired(false);
    setShowUserSwitch(false);
    return result;
  }, [auth]);

  const handleUserSwitchSignIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await auth.signIn(email, password);
      if (error) return { error };
      setShowUserSwitch(false);
      return { error: undefined, userId: data?.user?.id };
    },
    [auth]
  );

  const openUserSwitchScreen = useCallback(() => {
    setShowUserSwitch(true);
  }, []);

  const value: AuthContextType = {
    ...auth,
    user: isLocked ? null : auth.user,
    session: isLocked ? null : auth.session,
    isLocked,
    lockSession,
    unlockSession,
    sessionExpired,
    showUserSwitch,
    openUserSwitchScreen,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isLocked && (
        <LockScreen
          onUnlock={unlockSession}
          onSignOut={async () => {
            const result = await auth.signOut();
            setIsLocked(false);
            return result;
          }}
        />
      )}
      {sessionExpired && (
        <UserSwitchScreen
          sessionExpired
          message="Your session expired. Sign in to continue."
          previousUserId={lastUserIdRef.current}
          onSignIn={handleSessionExpiredSignIn}
          onSignOut={handleSessionExpiredSignOut}
        />
      )}
      {showUserSwitch && auth.user && (
        <UserSwitchScreen
          sessionExpired={false}
          previousUserId={auth.user.id}
          onSignIn={handleUserSwitchSignIn}
          onSignOut={handleSessionExpiredSignOut}
          onSwitchedUser={async () => {
            window.location.reload();
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
