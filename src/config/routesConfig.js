// routesConfig.js
const nav = {
    "/dashboard": [],
    "/users": [],
    "/teams": [
        "/teams/edit"
    ],
    "/members": [
        "/members/edit"
    ],
    "/playlist": [
        // "/playlist/edit"
    ],
    "/voice": [],
    "/language": [],
    "/events": [
        // "/events/edit"
    ],
    "/sports": [
        "/sports/add",
        "/sports/edit"
    ],
    "/email-template": [
        "/add-category",
        "/email-template/edit",
    ],
    "/admin-and-access": [
        "/admin-and-access/add",
        "/admin-and-access/edit",
    ],
    "/contactus": [],
    "/cms": [
        "/cms/edit"
    ],
    "/broadcast": [
        "/broadcast/add"
    ],
    "/faq": [
        "/faq/add",
        "/faq/edit"
    ],
};

module.exports = nav;
