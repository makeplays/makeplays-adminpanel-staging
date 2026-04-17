// import packages
import axios from 'axios';

// import lib
import key from './index';
import { getAuthToken } from '../lib/localStorage'

axios.defaults.baseURL = key.API_URL;
axios.defaults.headers.common['Authorization'] = getAuthToken();

export const setAuthorization = (token) => {
    console.log('Setting token:', token);
    axios.defaults.headers.common['Authorization'] = token;
};

export default axios;