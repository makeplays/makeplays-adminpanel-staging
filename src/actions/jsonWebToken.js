import jwt_decode from "jwt-decode";

// import Files
import { SET_AUTHENTICATION } from "../constant";
import { JoinRoom } from "../config/socketIO";

export const decodeJwt = (token, dispatch) => {
  if (token) {
    token = token.replace("Bearer ", "");
    let decoded = {};
    try {
      decoded = jwt_decode(token);
    } catch (err) {
      decoded = {};
    }
    if (!decoded?._id) {
      return;
    }
    JoinRoom(decoded?._id?.toString());
    if (decoded) {
      dispatch({
        type: SET_AUTHENTICATION,
        authData: {
          isAuth: true,
          userId: decoded._id,
          restrictions: decoded.restrictions,
          accessLevel: decoded.accessLevel,
          role: decoded.role,
          name: decoded.name,
          email: decoded.email,
        },
      });
    }
  }
};
