import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, } from "react-router-dom";
import OTPInput from "react-otp-input";
import { isEmpty, } from "../lib/isEmpty";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const initialFormValue = {
  otp: "",
};

const OTPVerification = () => {

  const [otp, setOtp] = useState("");
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [errors, setErrors] = useState({});
  const history = useHistory();
  const location = useLocation();

  const handleSubmit = async () => {
    try {
      toast.success("OTP Verified Successfully");
      history.push({
        pathname: "/resetNewPassword",
        state: { datas: JSON.parse(location.state.datas) },
      });
    } catch (err) {
      console.log("handleSubmit__err", err);
    }
  };

  return (
    <>
      <Container fluid className="common_bg login_bg position-relative">
        <Row className="justify-content-center align-items-center row_card">
          <Col xl={6} lg={6} md={8} sm={12}>
            <div className="dashboard_box p-4">
              <div className="logo_sec d-flex justify-content-center">
                <img
                  src={require("../assets/images/logo1.svg").default}
                  className="img-fluid main_logo"
                />
              </div>
              <div className="profile_holder mt-3">
                <p className="header_title_big text-center text-sm-start">
                  OTP Verification
                </p>
              </div>

              <div className="profile_holder">
                <Row>
                  <Col lg={12} md={12} sm={12} className="mb-4">
                    <div className="rp_singleinput_holder">
                      <p className="rp_label mb-3 text-center">Enter OTP</p>
                      <div className="otp__holder d-flex justify-content-center">
                        <OTPInput
                          value={otp}
                          onChange={setOtp}
                          numInputs={4}
                          name="otp"
                          renderInput={(props) => <input {...props} />}
                        />
                      </div>
                      <span className="text-danger otp__holder d-flex justify-content-center">
                        {errors.otp}
                      </span>

                    </div>
                    <div className="mt-3 text-center text-sm-end">
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

export default OTPVerification;
