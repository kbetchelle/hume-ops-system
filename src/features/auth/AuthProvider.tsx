import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LockScreen } from "@/components/auth/LockScreen";

type AuthContextType = ReturnType<typeof useAuth> & {
  isLocked: boolean;
  lockSession: () => void;
  unlockSession: (email: string, password: string) => Promise<{ error: unknown }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [isLocked, setIsLocked] = useState(false);

  const lockSession = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockSession = useCallback(
    async (email: string, password: string) => {
      const { error } = await auth.signIn(email, password);
      if (!error) {
        setIsLocked(false);
      }
      return { error };
    },
    [auth]
  );

  const value: AuthContextType = {
    ...auth,
    user: isLocked ? null : auth.user,
    session: isLocked ? null : auth.session,
    isLocked,
    lockSession,
    unlockSession,
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
