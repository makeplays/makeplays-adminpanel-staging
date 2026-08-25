import { SET_AUTHENTICATION } from "../constant";
import { USE_SUPABASE } from "../config/featureFlags";
import { SESSION_KEYS, clearSessionValue } from "./session";

// Set while a logout is in flight. Guards against two things:
//  1. Re-entrant logout calls (the 45s deactivation poll and a 401 interceptor
//     can both fire around the same time) racing each other.
//  2. The axios 401 interceptor's refreshToken() writing `token` back to
//     storage AFTER logout has already cleared it, which used to silently
//     resurrect a signed-out session.
let isLoggingOut = false;

export const getAuthToken = () => {
  if (localStorage.getItem("token")) {
    return localStorage.getItem("token");
  }
  return "";
};

export const setAuthToken = (token) => {
  if (isLoggingOut) return;
  if (token) {
    localStorage.setItem("token", `${token}`);
  }
};

// Clears every key this app's auth layer owns, in both localStorage and
// sessionStorage (session lives in one or the other depending on "Keep me
// signed in" — see lib/session.js). Deliberately NOT localStorage.clear(),
// which used to wipe the entire store (sidebar scroll position, wallet
// address, etc.) as a side effect of logging out.
export const removeAuthToken = () => {
  SESSION_KEYS.forEach((key) => clearSessionValue(key));
  localStorage.removeItem("adminWalletAddress");
};

export const setWalletAddress = (token) => {
  localStorage.setItem("adminWalletAddress", token);
};

export const getWalletAddress = () => {
  if (localStorage.getItem('adminWalletAddress')) {
    return localStorage.getItem('adminWalletAddress')
  }
  return '';
};

// Lazily clears the axios default Authorization header without creating an
// import cycle (config/axios.js imports refreshToken from api/adminApi.js,
// which imports this file).
const clearAxiosAuthHeader = () => {
  import("axios").then(({ default: axios }) => {
    delete axios.defaults.headers.common["Authorization"];
  }).catch(() => {});
};

// Logs the admin out for real: revokes the Supabase session, clears every
// local auth key, resets redux auth state, and reloads to the login page.
//
// dispatch is optional — most of the ~50 existing call sites in api/*.js call
// this without one (they run on request failure, not from a component), and
// the eventual full-page reload will re-derive isAuth=false from App.js's
// boot effect regardless.
export const logoutUser = (dispatch) => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  if (USE_SUPABASE.auth) {
    // scope: "local" only revokes THIS browser's refresh token. The default
    // ("global") revokes every session for the user on every device — logging
    // out here would silently sign the admin out of their phone/other laptop
    // too, which is not what "Logout" should do.
    import("../config/supabase")
      .then(({ supabase }) => supabase.auth.signOut({ scope: "local" }))
      .catch(() => {
        /* best-effort — local storage is cleared regardless below */
      });
  }

  removeAuthToken();
  clearAxiosAuthHeader();

  if (dispatch) {
    dispatch({
      type: SET_AUTHENTICATION,
      authData: {
        isAuth: false,
        isLoading: false,
        userId: "",
        restrictions: "",
        role: "",
        accessLevel: "",
        email: "",
        name: "",
      },
    });
  }

  window.location.href = "/";
};
