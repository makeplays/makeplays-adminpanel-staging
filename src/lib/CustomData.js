import CryptoJS from 'crypto-js';

export const Customdecryptdata = (data, key) => {
    try {
        const decData = CryptoJS.enc.Base64.parse(data)?.toString(CryptoJS.enc.Utf8);
        const bytes = CryptoJS.AES.decrypt(decData, key).toString(CryptoJS.enc.Utf8);
        return JSON.parse(bytes)
    } catch (err) {
        console.log("Customdecryptdata err", err);
    }
}

export const Customencryptdata = ((data, key) => {
    try {
        const encJson = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
        const encData = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse(encJson)
        );
        return encData
    } catch (err) {
        console.log("Customencryptdata__err", err)
    }
})