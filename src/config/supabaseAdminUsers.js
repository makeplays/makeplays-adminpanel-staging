// Supabase implementations of the admin-panel sub-admin APIs (Wave 9.1).
// All actions run in the admin-users edge function (auth Admin API needs the
// service role; the function verifies the caller is an active superadmin).
// Return shapes mirror adminApi.js ({status, message, result, count}).
import { supabase } from "./supabase";

async function call(action, payload = {}) {
  try {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action, ...payload },
    });
    if (error) {
      // FunctionsHttpError carries the edge response — surface its message
      let message = error.message;
      try {
        const ctx = await error.context?.json?.();
        if (ctx?.message) message = ctx.message;
      } catch (_) { /* keep generic message */ }
      return { status: false, message };
    }
    return data ?? { status: false, message: "No response" };
  } catch (err) {
    console.log("admin-users__err", action, err);
    return { status: false, message: "Something went wrong!" };
  }
}

export const CreateSubAdmin = async (data) => {
  const res = await call("create", {
    name: data?.name,
    email: data?.email,
    password: data?.password,
    accessLevel: data?.accessLevel,
    restrictions: data?.restrictions ?? [],
  });
  return { status: res.status, message: res.message };
};

export const listSubAdmin = async (reqData = {}) => {
  const res = await call("list", {
    page: Number(reqData?.page) || 1,
    limit: Number(reqData?.limit) || 10,
    search: reqData?.search ?? "",
  });
  return { status: res.status, message: res.message, result: res.data ?? [], count: res.count ?? 0 };
};

export const EditSubAdminData = async (data) => {
  const res = await call("update", {
    _id: data?._id,
    name: data?.name,
    email: data?.email,
    accessLevel: data?.accessLevel,
    restrictions: data?.restrictions ?? [],
  });
  return { status: res.status, message: res.message };
};

export const ActivateSubadmin = async (data) => {
  const res = await call("set-status", {
    _id: data?._id ?? data?.adminId,
    activate: data?.activate ?? data?.status,
  });
  return { status: res.status, message: res.message };
};
