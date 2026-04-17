let key = {};
let env = "demo";
if (env === "production") {
  //Set Production Config

  key = {
    secretOrKey: "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3",
    CRYPTO_SECRET_KEY: "1234567812345678",
    API_URL: "https://api.makeplays.ca/api/",
    IMAGE_URL: "https://api.makeplays.ca/",
    ADMIN_URL: "https://control-mkpl.makeplays.ca/",
  };
} else if (env === "demo") {
  //Set Demo Config`

  key = {
    secretOrKey: "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3",
    CRYPTO_SECRET_KEY: "1234567812345678",
    API_URL: "https://backend-makeplays.maticz.in/api/",
    IMAGE_URL: "https://backend-makeplays.maticz.in/",
    ADMIN_URL: "https://makeplays-adminpanel.pages.dev/",
  };
} else {
  //Set local Config

  const API_URL = "http://localhost";
  key = {
    secretOrKey: "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3",
    CRYPTO_SECRET_KEY: "1234567812345678",
    API_URL: `${API_URL}:2005/api/`,
    IMAGE_URL: `${API_URL}:2005`,
    ADMIN_URL: "http://localhost:3000/",
  };
}

export default key;
