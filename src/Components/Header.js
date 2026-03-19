import React, { useState, } from "react";
import { Col, Row, Dropdown, Offcanvas } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { removeAuthToken } from "../lib/localStorage";
import { Link } from "react-router-dom/cjs/react-router-dom";
import { CgProfile } from "react-icons/cg";
import { navLinks } from "../constant/staticData";
import { useAlert } from "../hooks/useAlert";
import { useSelector } from "react-redux";

function Header({ title }) {
  const history = useHistory();
  let AuthData = useSelector((state) => state.isRun);

  const { showAlert } = useAlert();

  const onConfirmHandle = async () => {
    try {
      removeAuthToken();
      localStorage.removeItem('token')
      history.push("/");

    } catch (err) {
      console.log("onConfirmHandle__err", err);
    }
  };

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
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
      confirmButtonText: "Yes"
    })
  }

  return (
    <>
      <div className="header px-lg-2">
        <Row className="align-items-center h-100 flex-grow-1 mt-3">
          <Col xl={6} lg={4} md={4} xs={7} className="d-flex gap-3">
            <p className="header_title d-block d-xl-none" onClick={handleShow}>
              <i class="fa-solid fa-bars" />
            </p>
            <p className="header_title">
              <span>
                {history.location.pathname.split("/")[1].replaceAll("-", " ")}
              </span>
              <span>{" "}
                {history.location.pathname.split("/")[2] ? history.location.pathname.split("/")[2] : ""}
              </span>
            </p>
          </Col>
          <Col
            xl={6}
            lg={8}
            md={8}
            xs={5}
            className="d-flex justify-content-end align-items-center gap-3 header-ryt-sec"
          >
            <div className="rightPart">
              <Dropdown align={"end"} className="profileDropdown">
                <div className="loginProfileCard">
                  <Dropdown.Toggle as="div" className="d-flex gap-2 align-items-center">
                    <CgProfile size={35} />
                    {/* <div>
                       <h3>{AuthData?.name}</h3>
                      <p>{AuthData?.email}</p>
                    </div> */}
                  </Dropdown.Toggle>
                </div>
                <Dropdown.Menu className="profileDropdownMenu">
                  <Dropdown.Item as={"p"}>
                    <Link className="w-100 d-flex" to={"/profile"}>Profile</Link>
                  </Dropdown.Item>
                  <Dropdown.Item as={"p"}>
                    <Link className="w-100 d-flex" to={"/resetpassword"}>Reset Password</Link>
                  </Dropdown.Item>
                  <Dropdown.Item as={"p"}>
                    <span className="w-100 d-flex" onClick={() => logutAlertHandle()}>Logout</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

          </Col>
        </Row>
      </div>

      {/* offcanva content */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        backdrop="static"
        className="header_canvas"
      >
        <Offcanvas.Body>
          <div className="header_canva_header pb-3 d-flex justify-content-between align-items-center">
            <NavLink to="/users">
              <img
                src={require("../assets/images/logo1.svg").default}
                className="img-fluid"
              />
            </NavLink>
            <button
              className="cmn_modal_closer rounded-5"
              onClick={handleClose}
            >
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          <ul className="pt-4 sidebar__scrollUl">
            {navLinks && navLinks.length > 0
              ? navLinks.map((item) => {
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
              })
              : ""}
            <li
              className="rounded-end-5 d-flex justify-content-start align-items-center gap-3 mb-3 p-2 ps-4"
              onClick={() => logutAlertHandle()}
            >
              <img
                src={require("../assets/images/logout.svg").default}
                className="img-fluid sidebar_linkImg"
              />
              <p className="sidebar_link_hint">Logout</p>
            </li>
          </ul>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Header;
