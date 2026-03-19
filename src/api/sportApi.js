// import config
import axios from '../config/axios';
import crypto from '../config/crypto';
import { setAuthorization } from '../config/axios';
import { logoutUser, setAuthToken } from '../lib/localStorage';
import { decodeJwt } from '../actions/jsonWebToken';
import { Customdecryptdata, Customencryptdata } from '../lib/CustomData';
var secretKey = crypto.cryptoSecretKey

export const AddSports = async (data) => {
    try {
        const respData = await axios({
            'url': `/admin/addSports`,
            'method': 'post',
            'data': data
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message
        }
    } catch (err) {
        console.log("AddSports__err", err)
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

export const listAllSports = async (reqData) => {
    try {
        const respData = await axios({
            'url': `/admin/getSports`,
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
        console.log("listAllSports__err", err)
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

export const EditSports = async (data) => {
    try {
        const respData = await axios({
            'url': `/admin/updateSports`,
            'method': 'post',
            'data': data
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message
        }
    } catch (err) {
        console.log("EditSports__err", err)
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

export const DeleteSports = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/deleteSports`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData?.status,
            message: decryptedData?.message,
        }
    } catch (error) {
        console.log("DeleteSports__error", error);
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

export const ActivateSports = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/ActivateSportsStatusUpdate`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message
        }

    } catch (err) {
        console.log("ActivateSports__err", err)
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