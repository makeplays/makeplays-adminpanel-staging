import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useLocation } from "react-router-dom";
import { isEmpty } from "../../lib/isEmpty";
import { reactSelectStyles, navLinks } from "../../constant/staticData";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import fileObjectUrl from "../../lib/fileObjectUrl";
import crypto from "../../config/crypto";
import { EditSubAdminData } from "../../api/adminApi";
import { Customdecryptdata, Customencryptdata } from "../../lib/CustomData";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import navConfig from "../../config/routesConfig";

const initialFormValue = {
  name: "",
  email: "",
  role: "",
  accessLevel: "",
  restrictions: "",
};

export const EditUsersPage = ({ handleClose, record }) => {
  const history = useHistory();
  const [errors, setErrors] = useState({});
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [navOption, setNavOption] = useState([]);
  const location = useLocation();
  const teamData = location.state.record || {};

  useEffect(() => {
    if (teamData) {
      setFormvalue({
        ...teamData,
      });
    }
  }, [teamData]);

  const userTypeStatusOptions = [
    { value: "Admin", label: "Full Access Admin" },
    { value: "View Only", label: "Restricted Access Admin" },
  ];

  const onChange = (selectedOption, selectname) => {
    try {
      setErrors({}); // clear errors

      if (selectname) {
        // Multi vs single select
        const value = Array.isArray(selectedOption)
          ? selectedOption.map((option) => option.value)
          : isEmpty(selectedOption?.value)
            ? []
            : selectedOption.value;

        // Always required routes
        const requiredValues = ["/profile", "/resetpassword"];

        let updatedValue = Array.isArray(value)
          ? [
              // Step 1: Remove required values from current array
              ...value.filter((v) => !requiredValues.includes(v)),
              // Step 2: Append them at the end in fixed order
              ...requiredValues,
            ]
          : value;

        setFormvalue((prevState) => {
          let updatedFormValue = { ...prevState, [selectname]: updatedValue };

          // Ensure restrictions is an array
          updatedFormValue.restrictions = updatedFormValue.restrictions || [];

          if (updatedFormValue.accessLevel === "Admin") {
            let subRoutes = updatedFormValue.restrictions.reduce(
              (acc, currVal) => {
                if (!isEmpty(navConfig[currVal])) {
                  acc.push(...navConfig[currVal]);
                }
                return acc;
              },
              [],
            );

            subRoutes = subRoutes.filter(
              (route) => !updatedFormValue.restrictions.includes(route),
            );

            updatedFormValue.restrictions = [
              ...new Set([...updatedFormValue.restrictions, ...subRoutes]),
            ];
          }

          if (updatedFormValue.accessLevel === "View Only") {
            const routesToRemove = Object.values(navConfig).flat();
            updatedFormValue.restrictions =
              updatedFormValue.restrictions.filter(
                (route) => !routesToRemove.includes(route),
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
      let NavOption = navLinks
        .filter((item) => item.path !== "/dashboard")
        .map((item) => ({
          label: item.name,
          value: item.path,
        }));

      //Add required routes manually if not already in navLinks
      const requiredRoutes = [
        { label: "Reset Password", value: "/resetpassword" },
        { label: "Profile", value: "/profile" },
      ];

      requiredRoutes.forEach((route) => {
        if (!NavOption.find((opt) => opt.value === route.value)) {
          NavOption.unshift(route); // put at top
        }
      });

      setNavOption(NavOption);
    } catch (err) {
      console.log("getNavOptions__err", err);
    }
  };

  const validation = () => {
    let errors = {};
    let emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;
    let passwordRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W).{6,18}(?!\S)/g;

    if (isEmpty(formvalue?.name)) {
      errors.name = "Name field is required";
    }
    if (isEmpty(formvalue?.email)) {
      errors.email = "Email field is required";
    }
    if (
      !isEmpty(formvalue?.email) &&
      isEmpty(formvalue?.email?.match(emailRegex))
    ) {
      errors.email = "Incorrect email format";
    }
    if (isEmpty(formvalue?.accessLevel)) {
      errors.accessLevel = "User type field is required";
    }
    if (formvalue?.accessLevel && formvalue?.accessLevel !== "Admin") {
      if (isEmpty(formvalue?.restrictions)) {
        errors.restrictions = "Access field is required";
      }
    }
    return errors;
  };

  const handleedit = async () => {
    try {
      const errs = validation(formvalue);
      if (isEmpty(errs)) {
        let updatedFormValue = { ...formvalue };
        updatedFormValue.restrictions = updatedFormValue.restrictions || [];

        if (updatedFormValue.accessLevel === "Admin") {
          // Expand all parent routes into sub-routes from navConfig
          let subRoutes = updatedFormValue.restrictions.reduce(
            (acc, currVal) => {
              if (navConfig[currVal] && Array.isArray(navConfig[currVal])) {
                acc.push(...navConfig[currVal]);
              }
              return acc;
            },
            [],
          );

          // Ensure no duplicates
          subRoutes = subRoutes.filter(
            (route) => !updatedFormValue.restrictions.includes(route),
          );

          updatedFormValue.restrictions = [
            ...new Set([...updatedFormValue.restrictions, ...subRoutes]),
          ];
        }

        if (updatedFormValue.accessLevel === "View Only") {
          // Remove all routes if view only
          const routesToRemove = Object.values(navConfig).flat();
          updatedFormValue.restrictions = updatedFormValue.restrictions.filter(
            (route) => !routesToRemove.includes(route),
          );
        }

        let { status, loading, message, error } =
          await EditSubAdminData(updatedFormValue);
        if (status) {
          CustomToastHandler({ msg: message });
          setErrors({});
          handleCloseModal();
        } else {
          if (error) {
            setErrors(error);
          } else if (message) {
            CustomToastHandler({ msg: message, type: "error" });
          }
        }
      } else {
        setErrors(errs);
      }
    } catch (err) {
      console.log("handleedit__err", err);
    }
  };

  const handleCloseModal = () => {
    setFormvalue(initialFormValue);
    setErrors({});
    // history.goBack();
    history.push("/admin-and-access");
  };
  return (
    <DashboardLayout>
      <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
        <section className="editPageContainer">
          <div>
            <div className="cmn_modal_header d-flex justify-content-between align-items-center">
              <p className="cmn_modal_title">Edit User</p>
              <button className="backBtn" onClick={handleCloseModal}>
                Back
              </button>
            </div>

            <div className="mt-4">
              <div className="rp_singleinput_holder mb-3">
                <p className="rp_label mb-2">Name</p>
                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                  <input
                    type="text"
                    name="name"
                    className="rp_singleInput flex-grow-1"
                    value={formvalue.name}
                    onChange={(e) => {
                      onChange(e);
                    }}
                  />
                </div>
                <span className="text-danger">{errors.name}</span>
              </div>

              <div className="rp_singleinput_holder mb-3">
                <p className="rp_label mb-2">Email</p>
                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                  <input
                    type="text"
                    name="email"
                    className="rp_singleInput flex-grow-1"
                    value={formvalue.email}
                    onChange={(e) => {
                      onChange(e);
                    }}
                  />
                </div>
                <span className="text-danger">{errors.email}</span>
              </div>

              <div className="rp_singleinput_holder mb-3">
                <p className="rp_label mb-2">Admin Type</p>
                <div className="rp_input_holder rounded-2 px-0">
                  <Select
                    name="accessLevel"
                    onChange={(e) => onChange(e, "accessLevel")}
                    options={userTypeStatusOptions}
                    value={
                      formvalue.accessLevel
                        ? userTypeStatusOptions.find(
                            (val) => val.value == formvalue.accessLevel,
                          )
                        : ""
                    }
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
                              formvalue.restrictions.includes(opt.value),
                            )
                          : []
                      }
                      isMulti
                      isSearchable
                      classNamePrefix="customselect"
                      styles={reactSelectStyles}
                    />
                  </div>
                  {errors.restrictions && (
                    <span className="text-danger">{errors.restrictions}</span>
                  )}
                </div>
              )}

              <button
                className="orange_small_primary mt-3"
                onClick={() => {
                  handleedit();
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};
