import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import { isEmpty, ObjectIsempty } from "../lib/isEmpty";
import { useHistory } from "react-router-dom";
import { CustomToastHandler } from "../hooks/useCustomToast";
import { sendForgotMail, ForgotPasswords } from '../api/adminApi'
import toast from "react-hot-toast";

const initialFormValue = {
  otp: "",
  email: "",
  newPassword: "",
  confirmPassword: "",
};

const ForgotPassword = () => {
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [errors, setErrors] = useState({});
  const history = useHistory();
  const [otpPwd, setOtpPwd] = useState(true);
  const [newPwd, setNewPwd] = useState(true);
  const [confirmPwd, setConfirmPwd] = useState(true);

  const handleChange = (e) => {
    try {
      setErrors({});
      let { name, value } = e.target;
      setFormvalue({ ...formvalue, [name]: value });
    } catch (err) {
      console.log("handleChange__err", err);
    }
  };

  const sendOTP = async () => {
    const Data = {
      email: formvalue.email
    };
    let { status, message } = await sendForgotMail(Data);
    if (status) {
      CustomToastHandler({ msg: message })
    } else {
      CustomToastHandler({ msg: message, type: "error" })
    }
  };

  const handleSubmit = async () => {
    try {

      const Data = {
        otp: formvalue.otp,
        newPassword: formvalue.newPassword,
        confirmPassword: formvalue.confirmPassword,
        email: formvalue.email
      };
      let { status, message, error } = await ForgotPasswords(Data);
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({});
        history.push("/")
      } else {
        if (error) {
          setErrors(error);
        } else if (message) {
          CustomToastHandler({ msg: message, type: "error" })
        }
      }
    } catch (err) {
      console.log("handleSubmit__err", err);
    }
  };

  return (
    <>
      <Container fluid className="common_bg login_bg position-relative">
        <Row className="justify-content-center align-items-center row_card">
          <Col xl={5} lg={6} md={8} sm={12}>
            <div className="dashboard_box p-4">
              <div className="logo_sec d-flex justify-content-center">
                <img
                  src={require("../assets/images/logo1.svg").default}
                  className="img-fluid main_logo"
                />
              </div>
              <div className="profile_holder mt-4">
                <p className="header_title_big">Forgot Password</p>
                <hr className="grey_hr" />
              </div>

              <div className="profile_holder">
                <Row>
                  <Col lg={12} md={12} sm={12} className="mb-4">
                    <div className="rp_singleinput_holder">
                      <p className="rp_label mb-2">Email</p>
                      <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter Email Address"
                          name="email"
                          value={formvalue?.email}
                          onChange={(e) => handleChange(e)}
                          className="rp_singleInput flex-grow-1"
                        />
                      </div>
                      {
                        errors?.email && <span className="text-danger">{errors?.email}</span>
                      }
                    </div>
                    <div className="text-start">
                      <button
                        className="orange_small_primary"
                        onClick={() => sendOTP()}
                      >
                        Send OTP
                      </button>
                    </div>
                    <div className="rp_singleinput_holder ">
                      <p className="rp_label mb-2 mt-4">Enter OTP</p>
                      <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                        <input
                          type={!otpPwd ? "text" : "password"}
                          placeholder="Enter OTP"
                          name="otp"
                          value={formvalue?.otp}
                          onChange={(e) => handleChange(e)}
                          className="rp_singleInput flex-grow-1"
                        />
                        <i
                          class={
                            otpPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                          }
                          onClick={() => setOtpPwd(!otpPwd)}
                        />
                      </div>
                      {
                        errors?.otp && <span className="text-danger">{errors?.otp}</span>
                      }
                    </div>
                    <div className="rp_singleinput_holder">
                      <p className="rp_label mb-2">New Password</p>
                      <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                        <input
                          type={!newPwd ? "text" : "password"}
                          placeholder="Enter New Password"
                          name="newPassword"
                          value={formvalue?.newPassword}
                          onChange={(e) => handleChange(e)}
                          className="rp_singleInput flex-grow-1"
                        />
                        <i
                          class={
                            newPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                          }
                          onClick={() => setNewPwd(!newPwd)}
                        />
                      </div>
                      {
                        errors?.newPassword && <span className="text-danger">{errors?.newPassword}</span>
                      }
                    </div>
                    <div className="rp_singleinput_holder">
                      <p className="rp_label mb-2">Confirm Password</p>
                      <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                        <input
                          type={!confirmPwd ? "text" : "password"}
                          placeholder="Enter Confirm Password"
                          name="confirmPassword"
                          value={formvalue?.confirmPassword}
                          onChange={(e) => handleChange(e)}
                          className="rp_singleInput flex-grow-1"
                        />
                        <i
                          class={
                            confirmPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                          }
                          onClick={() => setConfirmPwd(!confirmPwd)}
                        />
                      </div>
                      {
                        errors?.confirmPassword && <span className="text-danger">{errors?.confirmPassword}</span>
                      }
                    </div>
                    <div className="mt-3 text-end">
                      <Link to="/" className="link_theme">
                        Back to Login?
                      </Link>
                    </div>
                  </Col>
                </Row>
                <div className="text-center">
                  <button
                    className="orange_small_primary"
                    onClick={() => {
                      handleSubmit();
                    }}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ForgotPassword;
