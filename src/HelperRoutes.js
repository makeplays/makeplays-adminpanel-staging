import React, { useEffect, useContext, useRef, useState } from 'react';
import SocketContext from './context/socketContext';
import jwt_decode from "jwt-decode";
import { JoinRoom } from './config/socketIO';
import { LogoutUser } from "./actions/authActions";
import { logoutUser } from './lib/localStorage'
import { useDispatch } from 'react-redux';
import { USE_SUPABASE } from './config/featureFlags';
import { supabase } from './config/supabase';

// how often to check whether THIS admin session has been deactivated
// (Wave 10 audit fix — replaces the legacy socket 'LOGOUT' push, which
// depended on the legacy backend's socket.io server unconditionally and
// could never actually fire against a Supabase session's JWT shape).
const FORCE_LOGOUT_POLL_MS = 45_000;

const HelperRoute = ({ children }) => {

    const socketContext = useContext(SocketContext);
    const dispatch = useDispatch()

    useEffect(() => {
        // legacy path only — JoinRoom no-ops when USE_SUPABASE.auth (socket is null)
        let token = localStorage.getItem('admin_token')
        if (token) {
            token = token.replace("Bearer ", "");
            const decoded = jwt_decode(token);
            if (decoded) {
                JoinRoom(decoded?._id?.toString())
            }
        }
    }, [])

    useEffect(() => {
        if (!socketContext?.socket) return;
        socketContext.socket.on('LOGOUT', (result) => {
            console.log("LOGOUT", result);
            logoutUser(dispatch);
        });

    }, [socketContext, dispatch]);

    // Force-logout for Supabase sessions: poll the signed-in admin's OWN
    // profile row (always readable — RLS lets a user select their own row)
    // and log out if a superadmin deactivated this account since login.
    useEffect(() => {
        if (!USE_SUPABASE.auth) return;
        let cancelled = false;
        const check = async () => {
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
        const id = setInterval(check, FORCE_LOGOUT_POLL_MS);
        return () => { cancelled = true; clearInterval(id); };
    }, [dispatch]);

    return <>{children}</>;
}

export default HelperRoute