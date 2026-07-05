import io from "socket.io-client";
import baseUrl from "../config/index";
import { getAuthToken } from "../lib/localStorage";
import isEmpty from "is-empty";
import jwt_decode from "jwt-decode";
import { USE_SUPABASE } from "./featureFlags";

const URL = baseUrl.IMAGE_URL;
let socketId;

// Wave 10 audit fix: this used to connect to the legacy backend's socket.io
// server UNCONDITIONALLY at module load, even with auth=true — an always-on
// dependency on a server we're trying to stop depending on. It also can't
// actually work today: JoinRoom below decodes `_id` from the JWT, but Supabase
// access tokens carry `sub`, not `_id`, so the room join was already silently
// broken post-migration. Force-logout now runs via a Supabase poll instead
// (see HelperRoutes.js) — no socket needed when auth is on Supabase.
export const socket = USE_SUPABASE.auth ? null : io(URL);

export const createConnection = () => {
  if (USE_SUPABASE.auth) return;
  try {
    let token = getAuthToken();
    if (!isEmpty(token)) {
      token = token.replace("Bearer ", "");
      const decoded = jwt_decode(token);
      JoinRoom(decoded._id);
    }
  } catch (e) {
    console.log("Erro on connection---->", e);
  }
};

export const JoinRoom = (data) => {
  if (!socket) return;
  console.log("joinRoom", data);
  socket.emit("CREATEROOM", data);
};

// socket.on('connection', () => {
//     socketId = socket.id
//     console.log("------------------->SocketTest", socket.connected);
//     if (socket.connected) {
//         createConnection()
//     }
// })
