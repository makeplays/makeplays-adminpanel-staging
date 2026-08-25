import React, { useEffect, useContext, useRef, useState } from 'react';
import SocketContext from './context/socketContext';
import { logoutUser } from './lib/localStorage'
import { useDispatch } from 'react-redux';
import { USE_SUPABASE } from './config/featureFlags';
import { supabase } from './config/supabase';
import { useIdleLogout } from './hooks/useIdleLogout';
import { isSessionExpired } from './lib/session';
import { getAuthToken } from './lib/localStorage';
import { isEmpty } from './lib/isEmpty';

// how often to check whether THIS admin session has been deactivated
// (Wave 10 audit fix — replaces the legacy socket 'LOGOUT' push, which
// depended on the legacy backend's socket.io server unconditionally and
// could never actually fire against a Supabase session's JWT shape).
// Also carries the 12h absolute-session-cap check (see lib/session.js).
const FORCE_LOGOUT_POLL_MS = 45_000;

const HelperRoute = ({ children }) => {

    const socketContext = useContext(SocketContext);
    const dispatch = useDispatch()

    useIdleLogout();

    useEffect(() => {
        if (!socketContext?.socket) return;
        socketContext.socket.on('LOGOUT', (result) => {
            console.log("LOGOUT", result);
            logoutUser(dispatch);
        });

    }, [socketContext, dispatch]);

    // Force-logout for Supabase sessions: poll the signed-in admin's OWN
    // profile row (always readable — RLS lets a user select their own row)
    // and log out if a superadmin deactivated this account since login, OR
    // if the session has outlived the 12h absolute cap (lib/session.js).
    useEffect(() => {
        if (!USE_SUPABASE.auth) return;
        let cancelled = false;
        const check = async () => {
            // Nothing to expire when there's no session to begin with — this
            // poll also runs on the logged-out login page, and a MISSING
            // login timestamp is (by design) treated as "expired" to force
            // a one-time re-login for pre-existing sessions. Without this
            // guard that combination causes an infinite reload loop here:
            // no token -> "expired" -> logoutUser() -> reload -> no token -> ...
            if (isEmpty(getAuthToken())) return;
            if (isSessionExpired()) {
                logoutUser(dispatch);
                return;
            }
            const { data: u } = await supabase.auth.getUser();
            if (!u?.user) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin, admin_role, activate')
                .eq('id', u.user.id)
                .maybeSingle();
            if (cancelled) return;
            if (!profile?.is_super_admin || (profile.admin_role === 'subadmin' && profile.activate === false)) {
                logoutUser(dispatch);
            }
        };
        // Run once immediately — previously a deactivated admin (or an
        // expired session from a browser reopened after >12h) got a full
        // 45s window of access on every fresh page load before the first
        // poll tick.
        check();
        const id = setInterval(check, FORCE_LOGOUT_POLL_MS);
        return () => { cancelled = true; clearInterval(id); };
    }, [dispatch]);

    // Cross-tab logout: if another tab clears the auth token (user hit
    // Logout there, or that tab's idle/cap check fired), this tab follows.
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'token' && e.newValue == null) {
                logoutUser(dispatch);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [dispatch]);

    return <>{children}</>;
}

export default HelperRoute