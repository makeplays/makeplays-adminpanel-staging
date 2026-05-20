let key = {};
let env = "local";
if (env === "production") {
  //Set Production Config

  key = {
    secretOrKey: process.env.REACT_APP_SECRET_OR_KEY,
    CRYPTO_SECRET_KEY: process.env.REACT_APP_CRYPTO_SECRET_KEY,
    API_URL: "https://api.makeplays.ca/api/",
    IMAGE_URL: "https://api.makeplays.ca/",
    ADMIN_URL: "https://control-mkpl.makeplays.ca/",
  };
} else if (env === "demo") {
  //Set Demo Config`
  key = {
    secretOrKey: process.env.REACT_APP_SECRET_OR_KEY,
    CRYPTO_SECRET_KEY: process.env.REACT_APP_CRYPTO_SECRET_KEY,
    API_URL: "https://api-staging.makeplays.ca/api/",
    IMAGE_URL: "https://api-staging.makeplays.ca/",
    ADMIN_URL: "https://admin-staging.makeplays.ca/",
  };
} else {
  const API_URL = "http://localhost";
  key = {
    secretOrKey: process.env.REACT_APP_SECRET_OR_KEY,
    CRYPTO_SECRET_KEY: process.env.REACT_APP_CRYPTO_SECRET_KEY,
    API_URL: `${API_URL}:2005/api/`,
    IMAGE_URL: `${API_URL}:2005`,
    ADMIN_URL: "http://localhost:3000/",
  };
}

export default key;
