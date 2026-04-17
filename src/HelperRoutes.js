import React, { useEffect, useContext, useRef, useState } from 'react';
import SocketContext from './context/socketContext';
import jwt_decode from "jwt-decode";
import { JoinRoom } from './config/socketIO';
import { LogoutUser } from "./actions/authActions";
import { logoutUser } from './lib/localStorage'
import { useDispatch } from 'react-redux';

const HelperRoute = ({ children }) => {

    const socketContext = useContext(SocketContext);
    const dispatch = useDispatch()

    useEffect(() => {
        let token = localStorage.getItem('admin_token')
        if (token) {
            token = token.replace("Bearer ", "");
            const decoded = jwt_decode(token);
            if (decoded) {
                JoinRoom(decoded?._id?.toString())
            }
        }
    }, [])

    useEffect(() => {
        if (!socketContext?.socket) return;
        socketContext.socket.on('LOGOUT', (result) => {
            console.log("LOGOUT", result);
            logoutUser(dispatch);
        });

    }, [socketContext, dispatch]);

    return <>{children}</>;
}

export default HelperRoute