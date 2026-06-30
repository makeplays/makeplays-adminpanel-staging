// Supabase implementations of the admin-panel auth/profile/contact APIs
// (Wave 1). Wired into src/api/adminApi.js behind USE_SUPABASE.auth. When the
// flag is off, adminApi keeps using the legacy encrypted backend.
//
// The admin panel authenticates as a Supabase user flagged is_super_admin.
import { supabase } from "./supabase";
import { setAuthToken } from "../lib/localStorage";
import { SET_AUTHENTICATION } from "../constant";

// login({ email, password }, dispatch) -> { status, message }
export const login = async (data, dispatch) => {
  try {
    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) return { status: false, message: error.message };

    // Only super-admins may use the admin panel.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, is_super_admin")
      .eq("id", auth.user.id)
      .single();
    if (!profile?.is_super_admin) {
      await supabase.auth.signOut();
      return { status: false, message: "Not authorized for the admin panel." };
    }

    const token = auth.session?.access_token;
    setAuthToken(token);
    localStorage.setItem("refreshtoken", auth.session?.refresh_token ?? "");
    // NOTE: the sidebar/ConditionRoute gate on role==='superadmin' or
    // accessLevel==='Admin', and treat a FALSY `restrictions` as "no limits".
    // An empty array is truthy, so we leave restrictions undefined.
    dispatch({
      type: SET_AUTHENTICATION,
      authData: {
        isAuth: true,
        isLoading: false,
        userId: profile.id,
        restrictions: undefined,
        accessLevel: "Admin",
        role: "superadmin",
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
  return { status: true, message: "Profile fetched", result: { ...profile, email: u.user.email } };
};

// getContactUs(reqData) -> { status, count, result }
export const getContactUs = async (reqData = {}) => {
  let q = supabase.from("contact_us").select("*", { count: "exact" }).order("created_at", { ascending: false });
  const page = Number(reqData?.page) || 1;
  const limit = Number(reqData?.limit) || 10;
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Listed successfully", count: count ?? 0, result: data };
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
