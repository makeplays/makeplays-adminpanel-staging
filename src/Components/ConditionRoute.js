import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from 'react-redux'

// import lib
import isLogin from '../lib/isLogin';

const ConditionRoute = ({ component: Component, layout: Layout, auth, type, ...rest }) => {

    // redux-state
    const { role, restrictions, accessLevel } = useSelector((state) => state.isRun)

    return (

        <Route
            {...rest}
            render={(props) => {
                const isLoggedIn = isLogin();

                // 1. Auth routes (like login/register)
                if (type === "auth") {
                    if (isLoggedIn) {
                        return <Redirect to="/users" />;
                    }
                    return <Component {...props} />;
                }

                // 2. Private routes (only for logged-in users)
                if (type === "private") {
                    if (!isLoggedIn) {
                        return <Redirect to="/" />;
                    }

                    // Role restriction check
                    if (role !== "superadmin" && accessLevel !== "Admin") {
                        if (restrictions?.length > 0) {
                            const restrictionData = restrictions.includes(props.match.path);
                            if (!restrictionData) {
                                return <Redirect to={restrictions[0]} />;
                            }
                        }
                    }
                    return <Component {...props} />;
                }

                // 3. Default (public route)
                return <Component {...props} />;
            }}
        />

    )
};

export default ConditionRoute;