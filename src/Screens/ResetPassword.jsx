import React, { useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import Sidebar from '../Components/Sidebar'
import Header from '../Components/Header'

function ResetPassword() {

    const [oldPw,setOldPw] = useState(false)
    const [newPw,setNewPw] = useState(false)
    const [confirmPw,setConfirmPw] = useState(false)
  return (
    <>
    <Container fluid className='common_bg position-relative'>
    <div className='liner'></div>

    <Row>
        <Col xl={2} lg={0} className='p-0 d-none d-xl-block'>
            <Sidebar/>
        </Col>
        <Col xl={10} lg={12} className='pe-3'>
            <Header title={'Reset Password'}/>
            <div className='mt-5 profile_holder'>
                <Row>
                    <Col lg={7} className='mb-4'>
                    <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>Old Password</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                        <input type={oldPw ? 'text' :'password'} placeholder='Enter Old Password' className='rp_singleInput flex-grow-1' />

                        <i class={oldPw ? 'fa-solid fa-eye-slash' : "fa-solid fa-eye" } onClick={()=> setOldPw(!oldPw)}/>
                    </div>
                </div>
                    </Col>

                    <Col lg={7} className='mb-4'>
                    <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>New Password</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                        <input type={newPw ? 'text' :'password'} placeholder='Enter New Password' className='rp_singleInput flex-grow-1' />

                        <i class={newPw ? 'fa-solid fa-eye-slash' : "fa-solid fa-eye" } onClick={()=> setNewPw(!newPw)}/>
                    </div>
                </div>
                    </Col>

                    <Col lg={7} className='mb-4'>
                    <div className='rp_singleinput_holder'>
                    <p className='rp_label mb-2'>Confirm password</p>
                    <div className='rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2'>
                        <input type={confirmPw ? 'text' :'password'} placeholder='Enter Confirm Password' className='rp_singleInput flex-grow-1' />

                        <i class={confirmPw ? 'fa-solid fa-eye-slash' : "fa-solid fa-eye" } onClick={()=> setConfirmPw(!confirmPw)}/>
                    </div>
                </div>
                    </Col>
                </Row>

                <button className='orange_small_primary'>Submit</button>
                
            </div>
        </Col>
    </Row>

    </Container>
    </>
  )
}

export default ResetPassword