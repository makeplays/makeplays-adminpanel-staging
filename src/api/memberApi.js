// import config
import axios from '../config/axios';
import crypto from '../config/crypto';
import { setAuthorization } from '../config/axios';
import { logoutUser, setAuthToken } from '../lib/localStorage';
import { decodeJwt } from '../actions/jsonWebToken';
import { Customdecryptdata, Customencryptdata } from '../lib/CustomData';
var secretKey = crypto.cryptoSecretKey

export const listAllMember = async (reqData) => {
    try {
        const respData = await axios({
            'url': `/admin/getAllTeamMembers`,
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
        console.log("listAllMember__err", err)
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

export const Editmember = async (data) => {
    try {
        const respData = await axios({
            'url': `/admin/updateMember`,
            'method': 'post',
            'data': data
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData.status,
            message: decryptedData.message
        }
    } catch (err) {
        console.log("Editmember__err", err)
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

export const DeleteMember = async (data) => {
    try {
        const encryptedData = Customencryptdata(data, secretKey)
        const respData = await axios({
            'url': `/admin/deleteMember`,
            'method': 'post',
            'data': { token: encryptedData }
        })
        const decryptedData = Customdecryptdata(respData?.data, secretKey)
        return {
            status: decryptedData?.status,
            message: decryptedData?.message,
        }
    } catch (error) {
        console.log("DeleteMember__error", error);
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