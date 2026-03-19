import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { useDispatch } from 'react-redux'
import { getProfile, EditProfiles } from "../api/adminApi";
import { isEmpty, ObjectIsempty } from "../lib/isEmpty";
import { CustomToastHandler } from "../hooks/useCustomToast";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import { IoMdClose } from "react-icons/io";
import { Modal, Button, Form, } from "react-bootstrap";

const initialFormValue = {
    name: "",
    email: ""
};

const ProfilePage = () => {

    const [errors, setErrors] = useState({});
    const [formValue, setFormValue] = useState({ initialFormValue });
    const [openEditList, setOpenEditList] = useState(false);
    const [editValue, setEditValue] = useState(initialFormValue);

    useEffect(() => {
        getAdminDetails()
    }, [])

    const getAdminDetails = async () => {
        let { status, message, result } = await getProfile();
        if (status) {
            setFormValue(result)
        }
    }

    const validation = (value) => {
        try {
            let errors = {}
            if (isEmpty(value?.name)) {
                errors['name'] = 'Name field is required'
            }
            return errors
        } catch (error) {
            console.log("validation__err", error);
        }
    }

    const handleedit = async () => {
        let Validation = validation(editValue);
        if (!isEmpty(Validation)) {
            setErrors(Validation);
            return;
        }

        const { status, message, error } = await EditProfiles(editValue);
        if (status) {
            CustomToastHandler({ msg: message });
            setOpenEditList(false);
            setFormValue(editValue);
            setErrors({});
        } else {
            if (error) setErrors(error);
            else if (message) CustomToastHandler({ msg: message, type: "error" });
        }
    };

    return (
        <>

            <Container fluid className="common_bg position-relative">
                <div className="liner"></div>
                <Row>
                    <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
                        <Sidebar />
                    </Col>
                    <Col xl={10} lg={12}>
                        <Header title={"Profile"} />


                        <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                            <div className="mt-3 me-3">
                                <div className=" text-end">
                                    <button
                                        onClick={() => {
                                            setEditValue(formValue);
                                            setOpenEditList(true);
                                        }}
                                        className="orange_small_primary">
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                            <Row className="align-items-center">
                                <Col xl={5} lg={6} md={8} sm={12}>
                                    <div className="">

                                        <div className="profile_holder">
                                            <Row>
                                                <Col lg={12} md={12} sm={12} className="">
                                                    <div className="rp_singleinput_holder">
                                                        <p className="rp_label mb-2">Name</p>
                                                        <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                                                            <input
                                                                name="name"
                                                                value={formValue?.name}
                                                                className="rp_singleInput flex-grow-1"
                                                                readOnly
                                                            />
                                                        </div>
                                                        <span className="text-danger">{errors.email}</span>
                                                    </div>
                                                </Col>

                                                <Col lg={12} md={12} sm={12} className="">
                                                    <div className="rp_singleinput_holder">
                                                        <p className="rp_label mb-2">Email</p>
                                                        <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                                                            <input
                                                                name="email"
                                                                value={formValue?.email}
                                                                className="rp_singleInput flex-grow-1"
                                                                readOnly
                                                            />
                                                        </div>
                                                        <span className="text-danger">{errors.password}</span>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </Container>
            <Modal centered className="cmn_modal" show={openEditList}
                onHide={() => setOpenEditList(false)} backdrop="static" keyboard={false}>
                <Modal.Body>
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Edit List</p>
                        <button className="cmn_modal_closer rounded-5" onClick={() => setOpenEditList(false)}>
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Name</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="name"
                                    value={editValue?.name}
                                    onChange={(e) => setEditValue({ ...editValue, [e.target.name]: e.target.value })}
                                    className="rp_singleInput flex-grow-1"
                                />
                            </div>
                            <span className="text-danger">{errors && errors.name}</span>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center gap-2">
                        <button
                            className="secondary_btn mt-5 w-25"
                            onClick={() => setOpenEditList(false)}>
                            Cancel
                        </button>
                        <button
                            className="orange_small_primary mt-5 w-25"
                            onClick={() => { handleedit() }}
                        >
                            Save
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ProfilePage;
