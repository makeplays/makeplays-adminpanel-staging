import io from "socket.io-client";
import baseUrl from "../config/index";
import { getAuthToken } from "../lib/localStorage";
import isEmpty from "is-empty";
import jwt_decode from "jwt-decode";

const URL = baseUrl.IMAGE_URL;
let socketId;

export const socket = io(URL);

export const createConnection = () => {
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
