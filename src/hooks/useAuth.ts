import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if this is a session-only login (user didn't check "stay signed in")
    // If the session marker doesn't exist but user had a session, it means browser was closed and reopened
    const isSessionOnly = localStorage.getItem("hume_stay_signed_in") === "false";
    const hadSessionMarker = sessionStorage.getItem("hume_session_only") === "true";
    
    // #region agent log
    const log2={location:'useAuth.ts:10',message:'Auth useEffect initialization',data:{isSessionOnly,hadSessionMarker},timestamp:Date.now(),hypothesisId:'H1,H2'};
    console.log('[DEBUG]',log2);
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(log2)}).catch((e)=>console.warn('[DEBUG] Fetch failed:',e));
    // #endregion
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:17',message:'Auth state changed',data:{event:_event,hasSession:!!session,userId:session?.user?.id,isSessionOnly,hadSessionMarker},timestamp:Date.now(),hypothesisId:'H1,H2'})}).catch(()=>{});
        // #endregion
        
        // If user chose not to stay signed in and this is a new browser session, sign out
        if (session && isSessionOnly && !hadSessionMarker) {
          // New browser session detected for a user who didn't want to stay signed in
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:22',message:'Session-only signout triggered',data:{userId:session.user.id},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
          // #endregion
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:32',message:'Auth state set from listener',data:{hasUser:!!session?.user,loading:false},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:36',message:'Initial session check',data:{hasSession:!!session,hasError:!!error,errorMsg:error?.message,userId:session?.user?.id},timestamp:Date.now(),hypothesisId:'H1,H8'})}).catch(()=>{});
      // #endregion
      
      // If user chose not to stay signed in and this is a new browser session, sign out
      if (session && isSessionOnly && !hadSessionMarker) {
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

    return () => subscription.unsubscribe();
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
    // Clear session markers on sign out
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
