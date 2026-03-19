import {
    SET_CURRENT_USER,
    USER_ADD,
    USER_LOADING,
    USER_UPDATE,
    TEMPLATE_ADD,
    TEMPLATE_UPDATE,
    CMS_UPDATE,
    CMS_ADD,
    FAQ_UPDATE,
    FAQ_ADD,
    PERPETUAL_UPDATE,
    PERPETUAL_ADD,
    FORGOT,
    PROFILE_UPDATE,
    PASSWORD_UPDATE,
    SETTINGS_UPDATE,
    REPLY_CONTACT,
    SUPPORT_REPLY,
    CURRENCY_ADD,
    CURRENCY_UPDATE,
    CONTACT_ADD,
    Lauchpad_UPDATE,
} from "../actions/types";
const isEmpty = require("is-empty");
const initialState = {
    isAuthenticated: false,
    user: {},
    cms: {},
    updatecms: {},
    faq: {},
    replycontact: {},
    updatefaq: {},
    newuser: {},
    updatenewuser: {},
    forgot: {},
    template: {},
    updatetemplate: {},
    currencyadd: {},
    currencyupdate: {},
    loading: false
};
export default function (state = initialState, action) {
    switch (action.type) {
        case USER_ADD:
            return {
                ...state,
                newuser: action.payload
            };
        case USER_UPDATE:
            return {
                ...state,
                updatenewuser: action.payload,
            };
        case TEMPLATE_ADD:
            return {
                ...state,
                template: action.payload
            };
        case TEMPLATE_UPDATE:
            return {
                ...state,
                updatetemplate: action.payload
            };
        case CMS_ADD:
            return {
                ...state,
                cms: action.payload
            };
        case CMS_UPDATE:
            return {
                ...state,
                updatecms: action.payload
            };
        case FAQ_ADD:
            return {
                ...state,
                faq: action.payload
            };
        case FAQ_UPDATE:
            return {
                ...state,
                updatefaq: action.payload
            };
        case PERPETUAL_ADD:
            return {
                ...state,
                perpetual: action.payload
            };
        case PERPETUAL_UPDATE:
            return {
                ...state,
                updateperpetual: action.payload
            };
        case REPLY_CONTACT:
            return {
                ...state,
                replycontact: action.payload
            };
        case SUPPORT_REPLY:
            return {
                ...state,
                support_reply: action.payload
            };
        case CURRENCY_ADD:
            return {
                ...state,
                currencyadd: action.payload
            };
        case CURRENCY_UPDATE:
            return {
                ...state,
                currencyupdate: action.payload
            };
        case FORGOT:
            return {
                ...state,
                forgot: action.payload
            };
        case PROFILE_UPDATE:
            return {
                ...state,
                profile: action.payload
            };
        case PASSWORD_UPDATE:
            return {
                ...state,
                Changepassword: action.payload
            };
        case SETTINGS_UPDATE:
            return {
                ...state,
                updatesettings: action.payload
            };
        case SET_CURRENT_USER:
            return {
                ...state,
                isAuthenticated: !isEmpty(action.payload),
                user: action.payload
            };
        case USER_LOADING:
            return {
                ...state,
                loading: true
            };
        case CONTACT_ADD:
            return {
                ...state,
                Contactus: action.payload,
            };
        case Lauchpad_UPDATE:
            return {
                ...state,
                updatetemplate: action.payload,
            };

        default:
            return state;
    }
}
