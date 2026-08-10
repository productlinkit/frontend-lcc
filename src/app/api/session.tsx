/*
 * Who is signed in, for the whole app.
 *
 * The token itself lives in the API client (it has to, so requests can carry
 * it); this context holds the profile the UI renders and keeps React in step
 * with the client when a token is set, cleared, or dropped after a failed
 * refresh.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ApiError, tokens } from "./client";
import { auth, me } from "./endpoints";
import type { CitizenProfile, CitizenSession } from "./types";

interface SessionValue {
  /** True once a token is held; the profile may still be loading. */
  isAuthenticated: boolean;
  /** True while the stored token is being exchanged for a profile on boot. */
  loading: boolean;
  profile: CitizenProfile | undefined;
  /** Convenience: the citizen's display name, or "" when signed out. */
  name: string;
  signIn: (session: CitizenSession) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-read the profile — call after an edit so the header updates. */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(tokens.isAuthenticated());
  const [profile, setProfile] = useState<CitizenProfile | undefined>(undefined);
  const [loading, setLoading] = useState(tokens.isAuthenticated());

  const loadProfile = useCallback(async () => {
    if (!tokens.isAuthenticated()) {
      setProfile(undefined);
      return;
    }
    try {
      setProfile(await me.profile());
    } catch (err) {
      // A token that no longer resolves to an account is worse than no token:
      // it would leave the UI in a signed-in state with nothing behind it.
      if (err instanceof ApiError && (err.isUnauthorized || err.isForbidden)) {
        tokens.clear();
        setProfile(undefined);
      }
    }
  }, []);

  // A stored token survives a reload, so the profile is fetched once on boot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadProfile();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  // The client clears the token when a refresh fails; this keeps the UI honest.
  useEffect(() => tokens.subscribe(setAuthenticated), []);

  const signIn = useCallback(
    async (session: CitizenSession) => {
      tokens.set(session.tokens.access_token, session.tokens.refresh_token);
      setLoading(true);
      await loadProfile();
      setLoading(false);
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    const refresh = tokens.refresh;
    // Revoke server-side, but never let a failed call trap the user in a
    // session they asked to leave.
    if (refresh) await auth.logout(refresh).catch(() => undefined);
    tokens.clear();
    setProfile(undefined);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      isAuthenticated,
      loading,
      profile,
      name: profile?.account.name ?? "",
      signIn,
      signOut,
      refresh: loadProfile,
    }),
    [isAuthenticated, loading, profile, signIn, signOut, loadProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside a SessionProvider");
  return value;
}
