import React, { useCallback, useEffect, useMemo, useState } from "react";
import SportContext from "./sportContext";
import { getSports } from "../config/supabaseTeamSport";
import { supabase } from "../config/supabase";

const STORAGE_KEY = "activeSportId";

/**
 * Loads the sports catalogue once and holds the admin's active selection.
 *
 * Only `activate` sports are selectable — a deactivated sport would scope every
 * sport-dependent screen to rows the admin can no longer manage.
 *
 * The persisted id is VALIDATED against the freshly fetched list on every boot.
 * A sport that was deleted or deactivated since the last session would otherwise
 * leave the panel silently scoped to a dead uuid, showing zero rows everywhere
 * with no indication why.
 */
function SportProvider({ children }) {
  const [sports, setSports] = useState([]);
  const [sportId, setSportId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { status, result } = await getSports();
      if (cancelled) return;

      const active = status ? (result ?? []).filter((s) => s.activate) : [];
      setSports(active);

      let stored = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        // private mode / storage disabled — fall through to the default
      }

      // Keep a still-valid selection across refetches so an auth event does not
      // bounce the admin back to the first sport mid-session.
      setSportId((prev) => {
        const candidate = prev ?? stored;
        const isValid = candidate && active.some((s) => s._id === candidate);
        if (stored && !prev && !isValid) {
          console.log("[sport] stored sport is no longer active, falling back:", stored);
        }
        return isValid ? candidate : active[0]?._id ?? null;
      });
      setLoading(false);
    };

    load();

    // The sports catalogue is behind RLS, so a fetch before the Supabase
    // session exists returns zero rows. On a fresh login the provider mounts
    // during the redirect — before signInWithPassword has stored the session —
    // which is why the switcher read "No active sports" until a manual refresh
    // (by then the session was in storage and the first fetch succeeded).
    // Refetch whenever auth settles.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        load();
      } else if (event === "SIGNED_OUT") {
        setSports([]);
        setSportId(null);
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const setSport = useCallback((id) => {
    setSportId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      // non-fatal: the selection still applies for this session
    }
  }, []);

  const value = useMemo(
    () => ({
      sportId,
      sport: sports.find((s) => s._id === sportId) ?? null,
      sports,
      setSport,
      loading,
    }),
    [sportId, sports, setSport, loading],
  );

  return <SportContext.Provider value={value}>{children}</SportContext.Provider>;
}

export default SportProvider;
