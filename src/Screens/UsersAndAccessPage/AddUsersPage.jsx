import React, { useEffect, useState } from "react";
import { isEmpty } from "../../lib/isEmpty";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import fileObjectUrl from "../../lib/fileObjectUrl";
import crypto from '../../config/crypto';
import { CreateSubAdmin } from '../../api/adminApi'
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";
import Select from "react-select";
import { reactSelectStyles, navLinks } from "../../constant/staticData";
import navConfig from '../../config/routesConfig'

var secretKey = crypto.cryptoSecretKey

const initialFormValue = {
    name: "",
    email: "",
    password: "",
    restrictions: [],
    accessLevel: ""
};

export const AddUsersPage = ({ record }) => {
    const onChange = (selectedOption, selectname) => {
        try {
            setErrors({}); // clear errors

            if (selectname) {
                const value = Array.isArray(selectedOption)
                    ? selectedOption.map((option) => option.value)
                    : selectedOption.value;

                setFormvalue((prevState) => {
                    let updatedFormValue = { ...prevState, [selectname]: value };
                    updatedFormValue.restrictions = updatedFormValue.restrictions || [];

                    if (updatedFormValue.accessLevel === "Admin") {
                        let subRoutes = updatedFormValue.restrictions.reduce((val = [], currVal) => {
                            if (!isEmpty(navConfig[`${currVal}`])) {
                                val.push(...navConfig[`${currVal}`]);
                            }
                            return val;
                        }, []);

                        subRoutes = subRoutes.filter(
                            (route) => !updatedFormValue.restrictions.includes(route)
                        );

                        updatedFormValue.restrictions = [
                            ...updatedFormValue.restrictions,
                            ...subRoutes,
                        ];
                    }

                    if (updatedFormValue.accessLevel === "View Only") {
                        // Remove all routes from navConfig for view access
                        const routesToRemove = Object.values(navConfig).flat();
                        updatedFormValue.restrictions =
                            updatedFormValue.restrictions.filter(
                                (route) => !routesToRemove.includes(route)
                            );
                    }

                    return updatedFormValue;
                });
            } else {
                // For other input fields
                const { name, value } = selectedOption.target;
                setFormvalue((prevState) => ({
                    ...prevState,
                    [name]: value,
                }));
            }
        } catch (err) {
            console.log("onChange__err", err);
        }
    };

    useEffect(() => {
        getNavOptions();
    }, []);

    const getNavOptions = async () => {
        try {

            const NavOption = [];
            navLinks
                .filter((item) => item.path !== "/dashboard")
                .forEach((item) => {

                    // Add child items if they exist
                    if (item.childItem && Array.isArray(item.childItem)) {
                        item.childItem.forEach((child) => {
                            NavOption.push({
                                label: child.name,
                                value: child.path,
                            });
                        });
                    } else {
                        NavOption.push({
                            label: item.name,
                            value: item.path,
                        });
                    }
                });

            setNavOption(NavOption);
        } catch (err) {
            console.log("getNavOptions__err", err);
        }
    };

    const userTypeStatusOptions = [
        { value: "Admin", label: "Full Access Admin" },
        { value: "View Only", label: "Restricted Access Admin" },
    ];

    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});
    const history = useHistory();
    const [navOption, setNavOption] = useState([]);

    const validation = () => {
        let errors = {};
        let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;
        let passwordRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W).{6,18}(?!\S)/g;

        if (isEmpty(formvalue?.name)) {
            errors.name = "Name field is required";
        }
        if (isEmpty(formvalue?.email)) {
            errors.email = "Email field is required";
        }
        if (!isEmpty(formvalue?.email) &&
            isEmpty(formvalue?.email?.match(emailRegex))
        ) {
            errors.email = "Incorrect email format";
        }
        if (isEmpty(formvalue?.password)) {
            errors.password = "Password field is required";
        }
        if (
            !isEmpty(formvalue?.password) &&
            isEmpty(formvalue?.password?.match(passwordRegex))
        ) {
            errors.password = "Incorrect password format";
        }
        if (isEmpty(formvalue?.accessLevel)) {
            errors.accessLevel = "User type field is required";
        }
        if (formvalue?.accessLevel && formvalue?.accessLevel !== "Admin") {
            if (isEmpty(formvalue?.restrictions)) {
                errors.restrictions = "Access field is required";
            }
        }
        return errors
    }

    const handleSubmit = async () => {
        try {
            const errs = validation(formvalue);
            if (isEmpty(errs)) {
                let updatedFormValue = { ...formvalue };
                updatedFormValue.restrictions = updatedFormValue.restrictions || [];

                if (updatedFormValue.accessLevel === "Admin") {

                    // Add all routes from navConfig to restrictions for full access
                    let subRoutes = updatedFormValue.restrictions.reduce((val = [], currVal) => {
                        if (!isEmpty(navConfig[`${currVal}`])) {
                            val.push(...navConfig[`${currVal}`]);
                        }
                        return val;
                    }, []);

                    subRoutes = subRoutes.filter(
                        (route) => !updatedFormValue.restrictions.includes(route)
                    );

                    updatedFormValue.restrictions = [
                        ...updatedFormValue.restrictions,
                        ...subRoutes,
                    ];
                }

                if (updatedFormValue.accessLevel === "View Only") {
                    const routesToRemove = Object.values(navConfig).flat();
                    updatedFormValue.restrictions = updatedFormValue.restrictions.filter(
                        (route) => !routesToRemove.includes(route)
                    );
                }

                let { status, loading, message, error } = await CreateSubAdmin(updatedFormValue);
                if (status) {
                    CustomToastHandler({ msg: message })
                    setErrors({})
                    handleCloseModal()
                } else {
                    if (error) {
                        setErrors(error);
                    } else if (message) {
                        CustomToastHandler({ msg: message, type: "error" })
                    }
                }
            } else {
                setErrors(errs);
            }
        } catch (err) {
            console.log("handleSubmit__err", err);
        }
    };

    const handleCloseModal = () => {
        setFormvalue(initialFormValue);
        setErrors({});
        history.push("/admin-and-access")
    };
    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Create User</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Name</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="name"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.name}
                                    onChange={(e) => { onChange(e) }}
                                    placeholder="Name"
                                />
                            </div>
                            <span className="text-danger">{errors.name}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Email</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="email"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.email}
                                    onChange={(e) => { onChange(e) }}
                                    placeholder="Email"
                                />
                            </div>
                            <span className="text-danger">{errors.email}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Password</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="password"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.password}
                                    onChange={(e) => { onChange(e) }}
                                    placeholder="Password"
                                />
                            </div>
                            <span className="text-danger">{errors.password}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Admin Type</p>
                            <div className="rp_input_holder rounded-2 px-0 userType">
                                <Select
                                    name="accessLevel"
                                    id="accessLevel"
                                    options={userTypeStatusOptions}
                                    onChange={(e) => onChange(e, "accessLevel")}
                                    // value="View Only"
                                    // value={
                                    //     statusOptions.find(
                                    //         (opt) => opt.value === formValue?.sportId?._id
                                    //     ) || null
                                    // } 
                                    isSearchable={true}
                                    classNamePrefix="customselect"
                                    styles={reactSelectStyles}
                                />
                            </div>
                            <span className="text-danger">{errors.accessLevel}</span>
                        </div>

                        {formvalue.accessLevel && formvalue.accessLevel !== "Admin" && (
                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">Access</p>
                                <div className="rp_input_holder rounded-2 px-0 userType">
                                    <Select
                                        name="restrictions"
                                        id="restrictions"
                                        options={navOption}
                                        onChange={(e) => onChange(e, "restrictions")}
                                        value={
                                            formvalue.restrictions
                                                ? navOption.filter((opt) =>
                                                    formvalue.restrictions.includes(opt.value)
                                                )
                                                : []
                                        }
                                        isMulti
                                        isSearchable={true}
                                        classNamePrefix="customselect"
                                        styles={reactSelectStyles}
                                    />
                                </div>
                                <span className="text-danger">{errors.restrictions}</span>
                            </div>
                        )}

                        <button className="orange_small_primary mt-0" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};