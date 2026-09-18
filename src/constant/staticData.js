export const reactSelectStyles = {
    option: (styles, { isFocused, isSelected, isHovered }) => {
        return {
            ...styles,
            backgroundColor: isHovered
                ? "#00ddeb"
                : isSelected
                    ? "#00ddeb"
                    : isFocused
                        ? "#00ddeb"
                        : "#000",
            cursor: "pointer",
            color: isHovered
                ? "#000"
                : isSelected
                    ? "#000"
                    : isFocused
                        ? "#000"
                        : "#fff",
            fontSize: "13px",
            zIndex: 1,
        };
    },
    valueContainer: (provided, state) => ({
        ...provided,
        height: "43px",
        padding: "0px 10px",

        backgroundColor: "transparent",
        color: "red",
        border: "none",
        borderRadius: 0,
        fontSize: "13px",
    }),
    control: (provided, state) => ({
        ...provided,
        height: "40px",
        borderRadius: 10,
        backgroundColor: "transparent",
        border: "none",
        outline: "none",
        boxShadow: "none",
    }),
    indicatorsContainer: (provided, state) => ({
        ...provided,
        height: "40px",
        position: "absolute",
        right: 0,
        top: 0,
        color: "red",
        padding: "0px",
    }),
    singleValue: (provided, state) => ({
        ...provided,
        color: "#ffffff",
    }),
    menuList: (base) => ({
        ...base,

        padding: 0,
        width: "100%",

        borderRadius: 5,
        background: "transparent",
    }),
    placeholder: (defaultStyles) => {
        return {
            ...defaultStyles,
            color: "#fff",
        };
    },
};

export const navLinks = [
    {
        path: "/dashboard",
        name: "Dashboard",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/dashboardIcon.svg").default,
    },
    {
        path: "/broadcast",
        name: "Broadcast",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/BroadcastIcon.svg").default,
    },
    {
        path: "/users",
        name: "Users",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/userSetting.svg").default,
    },
    {
        path: "/teams",
        name: "Teams",
        scope: "sport",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/siteSetting.svg").default,
    },
    {
        path: "/members",
        name: "Members",
        scope: "sport",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/subadmin.svg").default,
    },
    {
        path: "/Voice",
        name: "Voice",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/voiceIcon.svg").default,
    },
    {
        path: "/events",
        name: "Events",
        scope: "sport",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/scheduler.svg").default,
    },
    {
        path: "/sports",
        name: "Sports",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/sportsIcon.svg").default,
    },
    // {
    //     path: "/attendance",
    //     name: "Attendance",
    //     exact: true,
    //     sidemenu: true,
    //     type: "private",
    //     image: require("../assets/images/attendanceIcon.svg").default,
    // },
    {
        path: "/announcement-template",
        name: "Announcement Templates",
        scope: "sport",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/voiceTemplateIcon.svg").default,
    },
    {
        path: "/email-template",
        name: "Email Template",
        scope: "sport",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/Email_template.svg").default,
    },
    {
        path: "/admin-and-access",
        name: "Admin and Access",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/usersAndAccess.svg").default,
    },
    // {
    //     path: "/credits",
    //     name: "Credits",
    //     exact: true,
    //     sidemenu: true,
    //     type: "private",
    //     image: require("../assets/images/creditsIcon.svg").default,
    // },
    {
        path: "/contactus",
        name: "Contact Us",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/contactusIcon.svg").default,
    },
    {
        path: "/cms",
        name: "CMS",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/cmsIcon.svg").default,
    },
    {
        path: "/faq",
        name: "FAQ",
        scope: "sport",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/faqIcon.svg").default,
    },
    {
        path: "/coupons",
        name: "Coupons",
        scope: "global",
        exact: true,
        sidemenu: true,
        type: "private",
        image: require("../assets/images/ticket.svg").default,
    },
];