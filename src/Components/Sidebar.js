import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { removeAuthToken } from "../lib/localStorage";
import { useHistory } from "react-router-dom";
import { navLinks } from "../constant/staticData";
import { useAlert } from "../hooks/useAlert";
import { useSelector } from "react-redux";

function Sidebar() {
  const history = useHistory();
  //redux-state
  let { restrictions, role, accessLevel } = useSelector((state) => state.isRun);
  const { showAlert } = useAlert();
  const sidebarRef = useRef();

  useEffect(() => {
    const saved = sessionStorage.getItem("scroll");
    if (saved) sidebarRef.current.scrollTop = saved;
  }, []);

  const onConfirmHandle = async () => {
    try {
      history.push("/");
      removeAuthToken();
    } catch (err) {
      console.log("onConfirmHandle__err", err);
    }
  };

  const logutAlertHandle = () => {
    showAlert({
      modalClassName: "logoutModel",
      onConfirm: onConfirmHandle,
      title: "Confirmation",
      icon: null,
      text: "Are you sure want to Logout ?",
      showCancelButton: true,
      showConfirmButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
  };

  return (
    <>
      <div className="sidebar d-flex flex-column justify-content-between align-items-start">
        <div className="w-100 sidebar_top">
          <div className="sidebar_logo_holder px-4 py-3 d-flex justify-content-center align-items-center">
            <NavLink to="/users">
              <img
                src={require("../assets/images/logo1.svg").default}
                className="img-fluid main_logo"
              />
            </NavLink>
          </div>
          <ul className="sidebar__scrollUl" ref={sidebarRef}
            onScroll={() =>
              sessionStorage.setItem("scroll", sidebarRef.current.scrollTop)
            }>
            {navLinks && navLinks.length > 0
              ? navLinks.map((item, i) => {
                //Restriction logic
                let allow = false;
                if (restrictions && restrictions.length > 0) {
                  allow = restrictions.includes(item.path);
                }

                if (
                  role === "superadmin" ||
                  accessLevel === "Admin" ||
                  (role === "subadmin" && allow)
                ) {
                  return (
                    <li className="rounded-end-5 mb-3">
                      <NavLink
                        to={item.path}
                        className="sidebar_links d-flex gap-3 justify-content-start align-items-center p-2 ps-4"
                      >
                        <img
                          src={item.image}
                          className="img-fluid sidebar_linkImg"
                        />
                        <p className="sidebar_link_hint">{item.name}</p>
                      </NavLink>
                    </li>
                  );
                }

                if (!restrictions || accessLevel === "Admin") {
                  return (
                    <li key={i} className="rounded-end-5 mb-3">
                      <NavLink
                        to={item.path}
                        className="sidebar_links d-flex gap-3 justify-content-start align-items-center p-2 ps-4"
                      >
                        <img
                          src={item.image}
                          className="img-fluid sidebar_linkImg"
                        />
                        <p className="sidebar_link_hint">{item.name}</p>
                      </NavLink>
                    </li>
                  );
                }

                return null;
              })
              : ""}

            {/* Logout */}
            <li
              className="rounded-end-5 d-flex justify-content-start align-items-center gap-3 p-2 ps-4"
              onClick={() => logutAlertHandle()}
            >
              <img
                src={require("../assets/images/logout.svg").default}
                className="img-fluid sidebar_linkImg"
              />
              <p className="sidebar_link_hint">Logout</p>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
