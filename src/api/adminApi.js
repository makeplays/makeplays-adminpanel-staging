// import config
import axios from "../config/axios";
import crypto from "../config/crypto";
import { setAuthorization } from "../config/axios";
import { logoutUser, setAuthToken } from "../lib/localStorage";
import { decodeJwt } from "../actions/jsonWebToken";
import { Customdecryptdata, Customencryptdata } from "../lib/CustomData";
import { USE_SUPABASE } from "../config/featureFlags";
import * as sbAdmin from "../config/supabaseAuthAdmin";
import * as sbEvent from "../config/supabaseEventAdmin";
import * as sbCommon from "../config/supabaseAdminCommon";
import * as sbAdminUsers from "../config/supabaseAdminUsers";
var secretKey = crypto.cryptoSecretKey;

export const login = async (data, dispatch) => {
  if (USE_SUPABASE.auth) return sbAdmin.login(data, dispatch);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/adminLogin`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    console.log("🚀 ~ login ~ decryptedData:", decryptedData);
    setAuthorization(decryptedData?.accessToken);
    setAuthToken(decryptedData?.accessToken);
    decodeJwt(decryptedData?.accessToken, dispatch);
    localStorage.setItem("refreshtoken", decryptedData?.refreshToken);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("login__err", err);
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData?.message,
    };
  }
};

export const refreshToken = async () => {
  if (USE_SUPABASE.auth) return sbAdmin.refreshToken();
  try {
    const refreshToken = localStorage.getItem("refreshtoken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const encryptedData = Customencryptdata({ refreshToken }, secretKey);
    const respData = await axios({
      url: `/admin/refreshToken`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    
    if (decryptedData?.accessToken) {
      setAuthorization(decryptedData?.accessToken);
      setAuthToken(decryptedData?.accessToken);
      localStorage.setItem("refreshtoken", decryptedData?.refreshToken);
      return decryptedData?.accessToken;
    } else {
      throw new Error("Invalid refresh token response");
    }
  } catch (err) {
    console.log("refreshToken__err", err);
    logoutUser();
    throw err;
  }
};

export const getUser = async (reqData) => {
  if (USE_SUPABASE.auth) return sbAdmin.getUser(reqData);
  try {
    const respData = await axios({
      url: `/admin/getuserData`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      count: decryptedData?.count,
      message: decryptedData.message,
      result: decryptedData.data,
    };
  } catch (err) {
    console.log("getUser__err", err);
    // Remove manual 401 handling - let axios interceptor handle token refresh
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.data,
    };
  }
};

export const getEmailTemplate = async () => {
  if (USE_SUPABASE.admin) return sbCommon.getEmailTemplate();
  try {
    const respData = await axios({
      url: `/admin/fetch_emailTemplate`,
      method: "get",
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
    };
  } catch (err) {
    console.log("getEmailTemplate__err", err);
    // Remove manual 401 handling - let axios interceptor handle token refresh
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.data,
    };
  }
};

export const EditTemplate = async (data, dispatch) => {
  if (USE_SUPABASE.admin) return sbCommon.EditTemplate(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/editTemplate`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    decodeJwt(decryptedData?.token, dispatch);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("EditTemplate__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData?.message,
    };
  }
};

export const sendForgotMail = async (data) => {
  if (USE_SUPABASE.auth) return sbAdmin.sendForgotMail(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/forgotSend-mail`,
      method: "post",
      data: { token: encryptedData },
    });

    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.result,
    };
  } catch (err) {
    console.log("sendForgotMail__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const ForgotPasswords = async (data) => {
  if (USE_SUPABASE.auth) return sbAdmin.ForgotPasswords(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    let respData = await axios({
      method: "post",
      url: `/admin/forgot-password`,
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      loading: false,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("ForgotPasswords__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      error: decryptedData?.errors,
      message: decryptedData.message,
    };
  }
};

export const sendMail = async (data) => {
  if (USE_SUPABASE.auth) return sbAdmin.sendMail(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/resetSend-mail`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.result,
    };
  } catch (err) {
    console.log("sendMail__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response.data, secretKey);
    return {
      status: false,
      message: decryptedData?.message,
    };
  }
};

export const resetPassword = async (data) => {
  if (USE_SUPABASE.auth) return sbAdmin.resetPassword(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    let respData = await axios({
      method: "post",
      url: `/admin/reset-password`,
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("resetPassword__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      errors: decryptedData?.errors,
      message: decryptedData.message,
    };
  }
};

export const getProfile = async () => {
  if (USE_SUPABASE.auth) return sbAdmin.getProfile();
  try {
    const respData = await axios({
      url: `/admin/getProfile`,
      method: "get",
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
    };
  } catch (err) {
    console.log("getProfile__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const EditProfiles = async (data) => {
  if (USE_SUPABASE.auth) return sbAdmin.EditProfiles(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/editProfile`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.result,
    };
  } catch (err) {
    console.log("EditProfiles__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: "error",
      message: decryptedData.message,
    };
  }
};

export const listAllVoices = async (reqData) => {
  if (USE_SUPABASE.voice && !reqData?.sync) return sbEvent.listAllVoices(reqData);
  try {
    if (reqData?.sync) {
      await axios({ url: `/user/getVoiceListAndSave`, method: "get" });
    }
    const { sync, ...restParams } = reqData || {};
    const respData = await axios({
      url: `/admin/getVoices`,
      method: "get",
      params: restParams,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("listAllVoices__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const GetSelectedVoices = async () => {
  try {
    const respData = await axios({
      url: `/admin/getSelectedVoices`,
      method: "get",
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("GetSelectedVoices__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const listAllLanguages = async (reqData) => {
  if (USE_SUPABASE.voice) return sbEvent.listAllLanguages(reqData);
  try {
    const respData = await axios({
      url: `/admin/getLanguage`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("listAllLanguages__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const listAllPlaylist = async (reqData) => {
  try {
    const respData = await axios({
      url: `/admin/getPlaylist`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("listAllPlaylist__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const EditPlaylist = async (data) => {
  try {
    const respData = await axios({
      url: `/admin/updatePlaylist`,
      method: "post",
      data: data,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("EditPlaylist__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const DeletePlaylist = async (data) => {
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/deletePlaylist`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData?.status,
      message: decryptedData?.message,
    };
  } catch (error) {
    console.log("DeletePlaylist__error", error);
    if (error?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(error?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const CreateSubAdmin = async (data) => {
  if (USE_SUPABASE.admin) return sbAdminUsers.CreateSubAdmin(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/createSubAdminUsers`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData?.status,
      message: decryptedData?.message,
    };
  } catch (error) {
    console.log("CreateSubAdmin__error", error);
    if (error?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(error?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const listSubAdmin = async (reqData) => {
  if (USE_SUPABASE.admin) return sbAdminUsers.listSubAdmin(reqData);
  try {
    const respData = await axios({
      url: `/admin/FetchSubAdminUsers`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("listSubAdmin__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const EditSubAdminData = async (data) => {
  if (USE_SUPABASE.admin) return sbAdminUsers.EditSubAdminData(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/UpdateSubAdminUsers`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("EditSubAdminData__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const ActivateSubadmin = async (data) => {
  if (USE_SUPABASE.admin) return sbAdminUsers.ActivateSubadmin(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/ActivateSubadminStatusUpdate`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("ActivateSubadmin__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

// Announcement Template
export const getAnnouncementTemplates = async (reqData) => {
  if (USE_SUPABASE.event) return sbEvent.getAnnouncementTemplates(reqData);
  try {
    const respData = await axios({ url: `/admin/getAnnouncementTemplates`, method: "get", params: reqData });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return { status: decryptedData.status, message: decryptedData.message, result: decryptedData.data, count: decryptedData.count };
  } catch (err) {
    console.log("getAnnouncementTemplates__err", err);
    if (!err?.response?.data) return { status: false, message: "Network error. Please check if the server is running." };
    const decryptedData = Customdecryptdata(err.response.data, secretKey);
    return { status: false, message: decryptedData?.message };
  }
};

export const addAnnouncementTemplate = async (data) => {
  if (USE_SUPABASE.event) return sbEvent.addAnnouncementTemplate(data);
  try {
    console.log('addAnnouncementTemplate-data', data);

    const encryptedData = Customencryptdata(data, secretKey);
    console.log('addAnnouncementTemplate-encryptedData', encryptedData);
    const respData = await axios({ url: `/admin/addAnnouncementTemplate`, method: "post", data: { token: encryptedData } });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return { status: decryptedData.status, message: decryptedData.message, result: decryptedData.data };
  } catch (err) {
    console.log("addAnnouncementTemplate__err", err);
    if (!err?.response?.data) return { status: false, message: "Network error. Please check if the server is running." };
    const decryptedData = Customdecryptdata(err.response.data, secretKey);
    return { status: false, message: decryptedData?.message };
  }
};

export const updateAnnouncementTemplate = async (data) => {
  if (USE_SUPABASE.event) return sbEvent.updateAnnouncementTemplate(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({ url: `/admin/updateAnnouncementTemplate`, method: "post", data: { token: encryptedData } });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return { status: decryptedData.status, message: decryptedData.message, result: decryptedData.data };
  } catch (err) {
    console.log("updateAnnouncementTemplate__err", err);
    if (!err?.response?.data) return { status: false, message: "Network error. Please check if the server is running." };
    const decryptedData = Customdecryptdata(err.response.data, secretKey);
    return { status: false, message: decryptedData?.message };
  }
};

export const deleteAnnouncementTemplate = async (data) => {
  if (USE_SUPABASE.event) return sbEvent.deleteAnnouncementTemplate(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({ url: `/admin/deleteAnnouncementTemplate`, method: "post", data: { token: encryptedData } });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return { status: decryptedData.status, message: decryptedData.message };
  } catch (err) {
    console.log("deleteAnnouncementTemplate__err", err);
    if (!err?.response?.data) return { status: false, message: "Network error. Please check if the server is running." };
    const decryptedData = Customdecryptdata(err.response.data, secretKey);
    return { status: false, message: decryptedData?.message };
  }
};

export const UpdateSelectedVoices = async (data) => {
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/updateSelectedVoices`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("UpdateSelectedVoices__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const getContactUsData = async (reqData) => {
  if (USE_SUPABASE.auth) return sbAdmin.getContactUs(reqData);
  try {
    const respData = await axios({
      url: `/admin/getContactUs`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("getContactUsData__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const listCounts = async () => {
  if (USE_SUPABASE.admin) return sbCommon.listCounts();
  try {
    const respData = await axios({
      url: `/admin/getDashboardData`,
      method: "get",
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
    };
  } catch (err) {
    console.log("listCounts__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const getCmsList = async (reqData) => {
  if (USE_SUPABASE.admin) return sbCommon.getCmsList(reqData);
  try {
    const respData = await axios({
      url: `/admin/getCms`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
      result: decryptedData.data,
      count: decryptedData?.count,
    };
  } catch (err) {
    console.log("getCmsList__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const EditCms = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.EditCms(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/editCms`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("EditCms__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const AddBroadcast = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.AddBroadcast(data);
  try {
    const respData = await axios({
      url: `/admin/addBroadcast`,
      method: "post",
      data: data,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("AddBroadcast__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const listAllBroadCast = async (reqData) => {
  if (USE_SUPABASE.admin) return sbCommon.listAllBroadCast(reqData);
  try {
    const respData = await axios({
      url: `/admin/getBroadcastNotification`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      count: decryptedData?.count,
      message: decryptedData.message,
      result: decryptedData.data,
    };
  } catch (err) {
    console.log("listAllBroadCast__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.data,
    };
  }
};

export const DeleteBroadCastNotify = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.DeleteBroadCastNotify(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/deleteBroadCastNotification`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData?.status,
      message: decryptedData?.message,
    };
  } catch (error) {
    console.log("DeleteBroadCastNotify__error", error);
    if (error?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(error?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const ResendBroadCastNotify = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.ResendBroadCastNotify(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/resendBroadCastNotification`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData?.status,
      message: decryptedData?.message,
    };
  } catch (error) {
    console.log("ResendBroadCastNotify__error", error);
    if (error?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(error?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const ReplyContactUs = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.ReplyContactUs(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/replyContactUs`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("ReplyContactUs__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const listAllFaq = async (reqData) => {
  if (USE_SUPABASE.admin) return sbCommon.listAllFaq(reqData);
  try {
    const respData = await axios({
      url: `/admin/getFaq`,
      method: "get",
      params: reqData,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      count: decryptedData?.count,
      message: decryptedData.message,
      result: decryptedData.data,
    };
  } catch (err) {
    console.log("listAllFaq__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.data,
    };
  }
};

export const DeleteFaq = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.DeleteFaq(data);
  try {
    const encryptedData = Customencryptdata(data, secretKey);
    const respData = await axios({
      url: `/admin/deleteFaq`,
      method: "post",
      data: { token: encryptedData },
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData?.status,
      message: decryptedData?.message,
    };
  } catch (error) {
    console.log("DeleteFaq__error", error);
    if (error?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(error?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const AddFaq = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.AddFaq(data);
  try {
    const respData = await axios({
      url: `/admin/addFaq`,
      method: "post",
      data: data,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("AddFaq__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const EditFaq = async (data) => {
  if (USE_SUPABASE.admin) return sbCommon.EditFaq(data);
  try {
    const respData = await axios({
      url: `/admin/updateFaq`,
      method: "post",
      data: data,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("EditSports__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

export const UploadImage = async (data) => {
  try {
    const respData = await axios({
      url: `/admin/updateAiImage`,
      method: "post",
      data: data,
    });
    const decryptedData = Customdecryptdata(respData?.data, secretKey);
    return {
      status: decryptedData.status,
      message: decryptedData.message,
    };
  } catch (err) {
    console.log("UploadImage__err", err);
    if (err?.status === 401) {
      logoutUser();
      return;
    }
    const decryptedData = Customdecryptdata(err?.response?.data, secretKey);
    return {
      status: false,
      message: decryptedData.message,
    };
  }
};

