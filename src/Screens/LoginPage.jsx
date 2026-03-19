import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { useDispatch } from 'react-redux'
import { login } from "../api/adminApi";
import { isEmpty, ObjectIsempty } from "../lib/isEmpty";
import { CustomToastHandler } from "../hooks/useCustomToast";

const initialFormValue = {
  email: "",
  password: "",
};

const LoginPage = () => {
  const [errors, setErrors] = useState({});
  const [formValue, setFormValue] = useState(initialFormValue);
  const [pwd, setPwd] = useState(true);
  const dispatch = useDispatch()

  // const navigate = useNavigate();
  const history = useHistory();

  const handleChange = (e) => {
    setErrors({});
    const { name, value } = e.target;
    setFormValue((prev) => ({ ...prev, [name]: value }));
  };

  const validation = () => {
    let errors = {};
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (isEmpty(formValue?.email)) {
      errors.email = "Email field is required";
    }
    else if (!(emailRegex.test(formValue?.email))) {
      errors.email = "Invalid email"
    }
    if (isEmpty(formValue?.password)) {
      errors.password = "Password field is required";
    }
    return errors
  }

  const onSubmit = async (e) => {
    try {
      let value = validation()
      if (!isEmpty(value)) {
        setErrors(value)
      }
      else {
        let { status, loading, error, message } = await login(formValue, dispatch);
        if (status) {
          CustomToastHandler({ msg: message })
          setErrors({})
          history.push("/dashboard")
        }
        else {
          if (error) {
            setErrors(error);
          } else if (message) {
            CustomToastHandler({ msg: message, type: "error" })
          }
        }
      }
    } catch (err) {
      console.log("onSubmit__err", err);
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
              <div className="profile_holder mt-4">
                <p className="header_title_big">Login</p>
                <hr className="grey_hr" />
              </div>

              <div className="profile_holder">
                <Row>
                  <Col lg={12} md={12} sm={12} className="mb-4">
                    <div className="rp_singleinput_holder">
                      <p className="rp_label mb-2">Email Address</p>
                      <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter Email Address"
                          name="email"
                          value={formValue?.email}
                          onChange={(e) => { handleChange(e) }}
                          className="rp_singleInput flex-grow-1"
                        />
                      </div>
                      <span className="text-danger">{errors.email}</span>
                    </div>
                  </Col>

                  <Col lg={12} md={12} sm={12} className="mb-4">
                    <div className="rp_singleinput_holder">
                      <p className="rp_label mb-2">Password</p>
                      <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                        <input
                          type={!pwd ? "text" : "password"}
                          placeholder="Enter Password"
                          name="password"
                          value={formValue?.password}
                          onChange={(e) => { handleChange(e) }}
                          className="rp_singleInput flex-grow-1"
                        />
                        <i
                          class={
                            pwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                          }
                          onClick={() => setPwd(!pwd)}
                        />
                      </div>
                      <span className="text-danger">{errors.password}</span>
                    </div>
                    <div className="mt-3 text-end">
                      <Link to="/forgot-password" className="link_theme">
                        Forgot Password?
                      </Link>
                    </div>
                  </Col>
                </Row>
                <div className="text-center">
                  <button
                    className="orange_small_primary"
                    onClick={() => {
                      onSubmit();
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

export default LoginPage;
