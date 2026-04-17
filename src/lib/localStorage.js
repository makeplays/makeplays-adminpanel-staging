export const getAuthToken = () => {
  if (localStorage.getItem("token")) {
    return localStorage.getItem("token");
  }
  return "";
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", `${token}`);
  }
};

export const removeAuthToken = () => {
  localStorage.clear("token");
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

export const logoutUser = () => {
  console.log("Logging out...");
  localStorage.removeItem("token");
  setAuthToken(false);
  window.location.href = '/'
};
