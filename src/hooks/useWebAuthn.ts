import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const WEBAUTHN_CREDENTIAL_IDS_KEY = "hume_webauthn_credential_ids";

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";
}

export function useWebAuthn() {
  const register = useCallback(async (): Promise<boolean> => {
    if (!isWebAuthnSupported()) return false;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return false;
      const res = await fetch(`${baseUrl}/functions/v1/webauthn-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const raw = await res.json().catch(() => ({}));
      const data = (raw?.data ?? raw) ?? {};
      if (!res.ok || !data.challenge) return false;

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(data.challenge), (c) => c.charCodeAt(0)),
          rp: { name: "HUME Ops", id: window.location.hostname || "localhost" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "user@hume",
            displayName: "User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
        },
      });

      if (!credential || !("rawId" in credential)) return false;
      const cred = credential as PublicKeyCredential;
      const response = cred.response as AuthenticatorAttestationResponse;
      const publicKey = response.getPublicKey?.();
      const keyB64 = publicKey
        ? btoa(String.fromCharCode(...new Uint8Array(publicKey)))
        : "";
      const idB64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));

      const verifyRes = await fetch(`${baseUrl}/functions/v1/webauthn-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "register",
          credentialId: idB64,
          publicKey: keyB64,
        }),
      });
      if (!verifyRes.ok) return false;

      const ids = JSON.parse(localStorage.getItem(WEBAUTHN_CREDENTIAL_IDS_KEY) ?? "[]");
      if (!ids.includes(idB64)) ids.push(idB64);
      localStorage.setItem(WEBAUTHN_CREDENTIAL_IDS_KEY, JSON.stringify(ids));
      return true;
    } catch {
      return false;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<{ userId?: string; redirectUrl?: string; error?: string }> => {
    if (!isWebAuthnSupported()) return { error: "Not supported" };
    try {
      const ids = JSON.parse(localStorage.getItem(WEBAUTHN_CREDENTIAL_IDS_KEY) ?? "[]");
      if (ids.length === 0) return { error: "No credential" };

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return { error: "Config error" };

      const res = await fetch(`${baseUrl}/functions/v1/webauthn-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", allowCredentials: ids }),
      });
      const raw = await res.json().catch(() => ({}));
      const data = raw?.data ?? raw;
      if (!res.ok || !data?.challenge || !data?.challengeToken) return { error: "Challenge failed" };

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(data.challenge), (c) => c.charCodeAt(0)),
          allowCredentials: ids.map((id: string) => ({
            id: Uint8Array.from(atob(id), (c) => c.charCodeAt(0)),
            type: "public-key",
          })),
          userVerification: "required",
        },
      });

      if (!credential || !("response" in credential)) return { error: "No credential" };
      const cred = credential as PublicKeyCredential;
      const response = cred.response as AuthenticatorAssertionResponse;

      const verifyRes = await fetch(`${baseUrl}/functions/v1/webauthn-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "authenticate",
          credentialId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),
          challengeToken: data.challengeToken,
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          authenticatorData: response.authenticatorData
            ? btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData)))
            : undefined,
          signature: response.signature
            ? btoa(String.fromCharCode(...new Uint8Array(response.signature)))
            : undefined,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) return { error: verifyData?.error ?? "Verification failed" };
      const redirectUrl = verifyData?.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return { redirectUrl };
      }
      return { userId: verifyData?.userId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Biometric login failed" };
    }
  }, []);

  const hasStoredCredential = useCallback((): boolean => {
    try {
      const ids = JSON.parse(localStorage.getItem(WEBAUTHN_CREDENTIAL_IDS_KEY) ?? "[]");
      return Array.isArray(ids) && ids.length > 0;
    } catch {
      return false;
    }
  }, []);

  return { register, authenticate, hasStoredCredential, isSupported: isWebAuthnSupported() };
}
