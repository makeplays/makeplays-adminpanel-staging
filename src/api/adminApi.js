// import config
import axios from "../config/axios";
import crypto from "../config/crypto";
import { setAuthorization } from "../config/axios";
import { logoutUser, setAuthToken } from "../lib/localStorage";
import { decodeJwt } from "../actions/jsonWebToken";
import { Customdecryptdata, Customencryptdata } from "../lib/CustomData";
var secretKey = crypto.cryptoSecretKey;

export const login = async (data, dispatch) => {
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
  try {
    const respData = await axios({
      url: `/admin/getVoices`,
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

