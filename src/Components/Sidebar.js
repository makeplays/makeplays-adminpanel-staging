import React, { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { logoutUser } from "../lib/localStorage";
import { navLinks } from "../constant/staticData";
import { useAlert } from "../hooks/useAlert";
import { useSelector, useDispatch } from "react-redux";
import SportSwitcher from "./SportSwitcher";

function Sidebar() {
  //redux-state
  let { restrictions, role, accessLevel } = useSelector((state) => state.isRun);
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const sidebarRef = useRef();

  useEffect(() => {
    const saved = sessionStorage.getItem("scroll");
    if (saved) sidebarRef.current.scrollTop = saved;
  }, []);

  const onConfirmHandle = () => {
    // logoutUser handles revoking the Supabase session, clearing every auth
    // key, and redirecting — same path every other logout trigger uses.
    logoutUser(dispatch);
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

  // Unchanged from the flat-list version: superadmin/Admin see everything, a
  // subadmin sees only what `restrictions` allows.
  const canSee = (item) => {
    let allow = false;
    if (restrictions && restrictions.length > 0) {
      allow = restrictions.includes(item.path);
    }
    if (role === "superadmin" || accessLevel === "Admin" || (role === "subadmin" && allow)) {
      return true;
    }
    return !restrictions || accessLevel === "Admin";
  };

  const renderLink = (item, i, extraClass = "") => (
    <li key={item.path ?? i} className={`rounded-end-5 mb-3 ${extraClass}`}>
      <NavLink
        to={item.path}
        className="sidebar_links d-flex gap-3 justify-content-start align-items-center p-2 ps-4"
      >
        <img src={item.image} className="img-fluid sidebar_linkImg" />
        <p className="sidebar_link_hint">{item.name}</p>
      </NavLink>
    </li>
  );

  const visible = (navLinks ?? []).filter(canSee);
  const sportLinks = visible.filter((l) => l.scope === "sport");
  const globalLinks = visible.filter((l) => l.scope !== "sport");

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

          <SportSwitcher />

          <ul
            className="sidebar__scrollUl"
            ref={sidebarRef}
            onScroll={() =>
              sessionStorage.setItem("scroll", sidebarRef.current.scrollTop)
            }
          >
            {/* Sport-dependent — these screens follow the switcher above. The
                accent bar and section label are redundant cues so the grouping
                does not rely on colour alone. */}
            {sportLinks.length > 0 && (
              <li className="sidebar_group_head sport_scoped">
                <span className="sidebar_group_label">MANAGE SPORT</span>
              </li>
            )}
            {sportLinks.map((item, i) => renderLink(item, i, "sport_scoped_link"))}

            {/* Global — unaffected by the active sport. */}
            {globalLinks.length > 0 && (
              <li className="sidebar_group_head">
                <span className="sidebar_group_label">PLATFORM</span>
              </li>
            )}
            {globalLinks.map((item, i) => renderLink(item, i))}

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
