import React, { useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import Sidebar from '../Components/Sidebar'
import Header from '../Components/Header'
import { CustomToastHandler } from "../hooks/useCustomToast";
import { sendMail, resetPassword } from '../api/adminApi'
import { logoutUser } from '../lib/localStorage'
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";

const initialValue = {
  otp: "",
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
};

function ResetPassword() {
  
  const [formValue, setFormValue] = useState(initialValue);
  const [errors, setError] = useState()
  const [showOtp, setShowOtp] = useState(false);
  const [oldPw, setOldPw] = useState(false)
  const [newPw, setNewPw] = useState(false)
  const [confirmPw, setConfirmPw] = useState(false)
  const history = useHistory();
  let email = useSelector((state) => state.isRun);

  const handlechange = (e) => {
    setError({})
    var { name, value } = e.target;
    setFormValue({ ...formValue, [name]: value });
  }

  const sendOTP = async () => {
    const Data = {
      email: email
    };
    let { status, message } = await sendMail(Data);
    if (status) {
      CustomToastHandler({ msg: message })
    } else {
      CustomToastHandler({ msg: message, type: "error" })
    }
  }

  const onLogout = (e) => {
    logoutUser();
    history.push("/")
  }

  const handleSubmit = async () => {
    const Data = {
      otp: formValue.otp,
      newPassword: formValue.newPassword,
      oldPassword: formValue.oldPassword,
      confirmPassword: formValue.confirmPassword,
      email: email
    };
    let { status, message, errors } = await resetPassword(Data);
    if (status) {
      CustomToastHandler({ msg: message })
      setError({})
      onLogout()
    } else {
      if (errors) {
        setError(errors);
      }
      else if (message) {
        CustomToastHandler({ msg: message, type: "error" })
      }
    }
  }

  return (
    <>
      <Container fluid className='common_bg position-relative'>
        <div className='liner'></div>
        <Row>
          <Col xl={2} lg={0} className='p-0 d-none d-xl-block'>
            <Sidebar />
          </Col>
          <Col xl={10} lg={12} className='pe-3'>
            <Header title={'Reset Password'} />
            <div className='mt-5 profile_holder'>
              <button className='orange_small_primary' onClick={() => sendOTP()}>Send OTP</button>
              <Row>
                <Col lg={7} className='mb-4 mt-4'>
                  <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>OTP</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                      <input type={showOtp ? 'text' : 'password'} placeholder='Enter OTP' className='rp_singleInput flex-grow-1' name='otp' value={formValue.otp} onChange={(e) => handlechange(e)} />
                      <i class={showOtp ? "fa-solid fa-eye" : 'fa-solid fa-eye-slash'} onClick={() => setShowOtp(!showOtp)} />
                    </div>
                    {
                      errors?.otp && <span className="text-danger">{errors?.otp}</span>
                    }
                  </div>
                </Col>

                <Col lg={7} className='mb-4'>
                  <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>Old Password</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                      <input type={oldPw ? 'text' : 'password'} placeholder='Enter Old Password' className='rp_singleInput flex-grow-1' name="oldPassword" value={formValue?.oldPassword} onChange={(e) => handlechange(e)} />
                      <i class={oldPw ? "fa-solid fa-eye" : 'fa-solid fa-eye-slash'} onClick={() => setOldPw(!oldPw)} />
                    </div>
                    {
                      errors?.oldPassword && <span className="text-danger">{errors?.oldPassword}</span>
                    }
                  </div>
                </Col>

                <Col lg={7} className='mb-4'>
                  <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>New Password</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                      <input type={newPw ? 'text' : 'password'} placeholder='Enter New Password' className='rp_singleInput flex-grow-1' name="newPassword" value={formValue?.newPassword} onChange={(e) => handlechange(e)} />
                      <i class={newPw ? "fa-solid fa-eye" : 'fa-solid fa-eye-slash'} onClick={() => setNewPw(!newPw)} />
                    </div>
                    {
                      errors?.newPassword && <span className="text-danger">{errors?.newPassword}</span>
                    }
                  </div>
                </Col>

                <Col lg={7} className='mb-4'>
                  <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>Confirm password</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                      <input type={confirmPw ? 'text' : 'password'} placeholder='Enter Confirm Password' className='rp_singleInput flex-grow-1' name="confirmPassword" value={formValue?.confirmPassword} onChange={(e) => handlechange(e)} />
                      <i class={confirmPw ? "fa-solid fa-eye" : 'fa-solid fa-eye-slash'} onClick={() => setConfirmPw(!confirmPw)} />
                    </div>
                    {
                      errors?.confirmPassword && <span className="text-danger">{errors?.confirmPassword}</span>
                    }
                  </div>
                </Col>
              </Row>

              <button className='orange_small_primary' onClick={() => handleSubmit()}>Submit</button>

            </div>
          </Col>
        </Row>

      </Container>
    </>
  )
}

export default ResetPassword