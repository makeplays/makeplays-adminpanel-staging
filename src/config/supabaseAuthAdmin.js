// Supabase implementations of the admin-panel auth/profile/contact APIs
// (Wave 1). Wired into src/api/adminApi.js behind USE_SUPABASE.auth. When the
// flag is off, adminApi keeps using the legacy encrypted backend.
//
// The admin panel authenticates as a Supabase user flagged is_super_admin.
import { supabase } from "./supabase";
import { setAuthToken, removeAuthToken } from "../lib/localStorage";
import { SET_AUTHENTICATION } from "../constant";
import { setPersistMode, markLoginAt } from "../lib/session";

// login({ email, password, rememberMe }, dispatch) -> { status, message }
export const login = async (data, dispatch) => {
  try {
    // Must be set BEFORE signInWithPassword — the Supabase client's storage
    // adapter (config/supabase.js) reads this to decide whether the session
    // it's about to persist goes to localStorage ("Keep me signed in") or
    // sessionStorage (dies with the tab).
    setPersistMode(data?.rememberMe ? "local" : "session");

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) return { status: false, message: error.message };

    // Only super-admins (and active sub-admins) may use the admin panel.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, is_super_admin, admin_role, access_level, restrictions, activate")
      .eq("id", auth.user.id)
      .single();
    if (!profile?.is_super_admin) {
      await supabase.auth.signOut();
      removeAuthToken();
      return { status: false, message: "Not authorized for the admin panel." };
    }
    if (profile.admin_role === "subadmin" && profile.activate === false) {
      await supabase.auth.signOut();
      removeAuthToken();
      return { status: false, message: "Your account has been deactivated." };
    }

    const token = auth.session?.access_token;
    setAuthToken(token);
    localStorage.setItem("refreshtoken", auth.session?.refresh_token ?? "");
    // Stamps the 12h absolute-session-cap clock. Deliberately NOT touched by
    // refreshToken() below — renewing the access token must never push the
    // ceiling out, or there would be no real cap at all.
    markLoginAt();
    // NOTE: the sidebar/ConditionRoute gate on role==='superadmin' or
    // accessLevel==='Admin', and treat a FALSY `restrictions` as "no limits".
    // An empty array is truthy — superadmins keep restrictions undefined;
    // sub-admins get their real accessLevel + restrictions (Wave 9.1).
    const isSub = profile.admin_role === "subadmin";
    dispatch({
      type: SET_AUTHENTICATION,
      authData: {
        isAuth: true,
        isLoading: false,
        userId: profile.id,
        restrictions: isSub ? (profile.restrictions ?? []) : undefined,
        accessLevel: isSub ? (profile.access_level || "View Only") : "Admin",
        role: isSub ? "subadmin" : "superadmin",
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        email: auth.user.email,
      },
    });
    return { status: true, message: "Login successful" };
  } catch (err) {
    console.log("sb admin login__err", err);
    return { status: false, message: "Something went wrong" };
  }
};

// refreshToken() -> accessToken (throws/logs out on failure, like legacy)
export const refreshToken = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    throw new Error("Invalid refresh token response");
  }
  setAuthToken(data.session.access_token);
  localStorage.setItem("refreshtoken", data.session.refresh_token);
  return data.session.access_token;
};

// getProfile() -> { status, data }
export const getProfile = async () => {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { status: false, message: "Not authenticated" };
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", u.user.id)
    .single();
  if (error) return { status: false, message: error.message };
  // ProfilePage reads a single `name` field (legacy Admin.name) — derive it
  // from first_name/last_name so it isn't blank (Wave 10 audit fix).
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return { status: true, message: "Profile fetched", result: { ...profile, name, email: u.user.email } };
};

// EditProfiles({name, email}) -> { status, message }
// Splits the single `name` field back into first_name/last_name; updates the
// auth email too if it changed (requires the user to confirm via email link,
// same as Supabase Auth's standard email-change flow).
export const EditProfiles = async (data) => {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { status: false, message: "Not authenticated" };
  const parts = String(data?.name ?? "").trim().split(/\s+/);
  const first_name = parts[0] ?? "";
  const last_name = parts.slice(1).join(" ");
  const { error } = await supabase
    .from("profiles").update({ first_name, last_name }).eq("id", u.user.id);
  if (error) return { status: false, message: error.message };
  if (data?.email && data.email !== u.user.email) {
    const { error: eErr } = await supabase.auth.updateUser({ email: data.email });
    if (eErr) return { status: false, message: eErr.message };
    return { status: true, message: "Profile updated. Confirm the new email via the link we sent it." };
  }
  return { status: true, message: "Profile updated successfully" };
};

// ─── forgot password (logged-out — OTP to email, then set new password) ────
export const sendForgotMail = async (data) => {
  const { error } = await supabase.auth.resetPasswordForEmail(data?.email);
  if (error) return { status: false, message: error.message };
  return { status: true, message: "We've sent an OTP to your email. Kindly check and verify." };
};

export const ForgotPasswords = async (data) => {
  const { error: vErr } = await supabase.auth.verifyOtp({
    email: data?.email, token: String(data?.otp ?? ""), type: "recovery",
  });
  if (vErr) return { status: false, message: "Invalid or expired OTP" };
  const { error: uErr } = await supabase.auth.updateUser({ password: data?.newPassword });
  if (uErr) return { status: false, message: uErr.message };
  await supabase.auth.signOut();
  return { status: true, message: "Password reset successfully. Please log in." };
};

// ─── reset password (logged-in — OTP to own email as a step-up, then change) ─
export const sendMail = async (data) => {
  const email = data?.email || (await supabase.auth.getUser()).data?.user?.email;
  if (!email) return { status: false, message: "Not authenticated" };
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { status: false, message: error.message };
  return { status: true, message: "We've sent an OTP to your email." };
};

export const resetPassword = async (data) => {
  // Step-up verification: the OTP just emailed re-authenticates the session
  // (same recovery-token mechanism as the logged-out flow) before the change
  // is allowed, mirroring the legacy old-password + OTP double-check.
  if (data?.otp) {
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: data?.email, token: String(data.otp), type: "recovery",
    });
    if (vErr) return { status: false, message: "Invalid or expired OTP" };
  }
  const { error } = await supabase.auth.updateUser({ password: data?.newPassword });
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Password updated successfully" };
};

// getContactUs(reqData) -> { status, count, result }
export const getContactUs = async (reqData = {}) => {
  let q = supabase.from("contact_us").select("*", { count: "exact" }).order("created_at", { ascending: false });
  const page = Number(reqData?.page) || 1;
  const limit = Number(reqData?.limit) || 10;
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  // legacy Mongo field names — the ContactUs list + Reply pages read _id/createdAt
  const result = (data ?? []).map((r) => ({
    _id: r.id,
    userId: r.user_id,
    name: r.name,
    email: r.email,
    message: r.message,
    reason: r.reason,
    createdAt: r.created_at,
  }));
  return { status: true, message: "Listed successfully", count: count ?? 0, result };
};

// Admin Users list — joins profiles + auth.users email via SECURITY DEFINER RPC.
export const getUser = async (reqData = {}) => {
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_page: Number(reqData?.page) || 1,
    p_limit: Number(reqData?.limit) || 10,
    p_search: reqData?.search || reqData?.firstname || "",
  });
  if (error) return { status: false, message: error.message };
  return { status: true, count: data?.count ?? 0, message: "Listed successfully", result: data?.users ?? [] };
};
