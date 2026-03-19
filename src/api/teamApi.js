// import config
import axios from '../config/axios';
import crypto from '../config/crypto';
import { setAuthorization } from '../config/axios';
import { logoutUser, setAuthToken } from '../lib/localStorage';
import { decodeJwt } from '../actions/jsonWebToken';
import { Customdecryptdata, Customencryptdata } from '../lib/CustomData';
var secretKey = crypto.cryptoSecretKey

export const listAllTeam = async (reqData) => {
    try {
        const respData = await axios({
            'url': `/admin/getAllTeam`,
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
        console.log("listAllTeam__err", err)
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


export const listAllTeams = async (reqData) => {
    try {
        const respData = await axios({
            'url': `/admin/getAllTeams`,
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
        console.log("listAllTeams__err", err)
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

export const EditTeams = async (data) => {
    try {
        const respData = await axios({
            'url': `/admin/updateTeam`,
            'method': 'post',
            'data': data
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message
        }
    } catch (err) {
        console.log("EditTeams__err", err)
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

export const getSports = async () => {
    try {
        const respData = await axios({
            'url': `/admin/getSports`,
            'method': 'get',
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message,
            result: decryptedData.data
        }
    } catch (err) {
        console.log("getSports__err", err)
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

export const DeleteTeam = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/deleteTeam`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData?.status,
            message: decryptedData?.message,
        }
    } catch (error) {
        console.log("DeleteTeam__error", error);
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