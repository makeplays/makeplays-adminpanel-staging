// import config
import axios from '../config/axios';
import crypto from '../config/crypto';
import { setAuthorization } from '../config/axios';
import { logoutUser, setAuthToken } from '../lib/localStorage';
import { decodeJwt } from '../actions/jsonWebToken';
import { Customdecryptdata, Customencryptdata } from '../lib/CustomData';
var secretKey = crypto.cryptoSecretKey

export const listAllEvent = async (reqData) => {
    try {
        const respData = await axios({
            'url': `/admin/getAllTeamEvents`,
            'method': 'get',
            'params': reqData
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            count: decryptedData?.count,
            message: decryptedData.message,
            result: decryptedData.data
        }
    } catch (err) {
        console.log("listAllEvent__err", err)
        if (err?.status === 401) {
            logoutUser()
            return
        }
        const decryptedData = Customdecryptdata(err?.response?.data, secretKey)
        return {
            status: false,
            message: decryptedData.data
        }
    }
}

export const EditEvent = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/updateEvents`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message
        }
    } catch (err) {
        console.log("EditEvent__err", err)
        if (err?.status === 401) {
            logoutUser()
            return
        }
        const decryptedData = Customdecryptdata(err?.response?.data, secretKey)
        return {
            status: false,
            message: decryptedData.message
        }
    }
}

export const getOpponetTeams = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/getOpponetTeams`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message,
            result: decryptedData.data
        }
    } catch (err) {
        console.log("getOpponetTeams__err", err)
        if (err?.status === 401) {
            logoutUser()
            return
        }
        const decryptedData = Customdecryptdata(err?.response?.data, secretKey)
        return {
            status: false,
            message: decryptedData.data
        }
    }
}

export const DeleteEvent = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/deleteEvents`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData?.status,
            message: decryptedData?.message,
        }
    } catch (error) {
        console.log("DeleteEvent__error", error);
        if (error?.status === 401) {
            logoutUser()
            return
        }
        const decryptedData = Customdecryptdata(error?.response?.data, secretKey)
        return {
            status: false,
            message: decryptedData.message
        }
    }
}