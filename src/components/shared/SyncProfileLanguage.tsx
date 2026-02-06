import { useEffect, useRef } from "react";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useLanguage } from "@/contexts/LanguageContext";

/** SessionStorage key for a language change not yet persisted; prevents reload from reverting UI. */
export const PREFERRED_LANGUAGE_PENDING_KEY = "preferred_language_pending";

/**
 * When profile loads with preferred_language, sync it to LanguageContext once per load
 * so the app defaults to the user's saved language (e.g. after onboarding or on new session).
 * If the user just changed language and the DB update is still in flight, we honor the pending
 * value so a reload doesn't revert the UI to the old profile value.
 */
export function SyncProfileLanguage() {
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { setLanguage } = useLanguage();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;

    const pending = sessionStorage.getItem(PREFERRED_LANGUAGE_PENDING_KEY);
    if (pending === "en" || pending === "es") {
      setLanguage(pending);
      sessionStorage.removeItem(PREFERRED_LANGUAGE_PENDING_KEY);
      hasSynced.current = true;
      return;
    }

    if (!profile?.preferred_language) return;
    const lang = profile.preferred_language;
    if (lang === "en" || lang === "es") {
      setLanguage(lang);
      hasSynced.current = true;
    }
  }, [profile?.preferred_language, setLanguage]);

  return null;
}
