import {
    SET_AUTHENTICATION
} from "../constant";

const initialState = {
    isAuth: false,
    isLoading: true,
    _id: "",
    name: "",
    email: ""
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_AUTHENTICATION:
            return {
                ...state,
                ...action.authData
            };
        default:
            return state;
    }
}

export default authReducer; 