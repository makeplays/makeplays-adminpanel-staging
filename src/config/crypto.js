let key = {};

key = {
  cryptoSecretKey: process.env.REACT_APP_CRYPTO_SECRET_KEY,
  secretKey: process.env.REACT_APP_SECRET_KEY,
};
export default {
  ...key,
};
