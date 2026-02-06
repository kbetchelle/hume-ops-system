import { useEffect, useRef } from "react";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * When profile loads with preferred_language, sync it to LanguageContext once per load
 * so the app defaults to the user's saved language (e.g. after onboarding or on new session).
 */
export function SyncProfileLanguage() {
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { setLanguage } = useLanguage();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!profile?.preferred_language || hasSynced.current) return;
    const lang = profile.preferred_language;
    if (lang === "en" || lang === "es") {
      setLanguage(lang);
      hasSynced.current = true;
    }
  }, [profile?.preferred_language, setLanguage]);

  return null;
}
