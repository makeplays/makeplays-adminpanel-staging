import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useLocation } from 'react-router-dom';
import { isEmpty } from "../../lib/isEmpty";
import { reactSelectStyles } from "../../constant/staticData";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import { Editmember } from '../../api/memberApi'
import fileObjectUrl from "../../lib/fileObjectUrl";
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";
import crypto from '../../config/crypto';
var secretKey = crypto.cryptoSecretKey

const initialFormValue = {
    firstname: "",
    email: "",
    position: "",
    phonenumber: "",
    number: "",
    address: "",
    city: "",
    country: "",
    province: "",
    postalcode: "",
    private: [],
    memberImage: "",
    aiVoice: ""
};
export const EditMembersPage = ({ show, handleClose, record }) => {
    const history = useHistory();
    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});
    const location = useLocation();
    const memberData = location.state.record || {};

    useEffect(() => {
        if (memberData) {
            const imageUrl = memberData.memberImage
                ? `${key.IMAGE_URL}/Member/${memberData.memberImage}`
                : '';

            const aiVoiceUrl = memberData.aiVoice
                ? `${key.IMAGE_URL}/MemberAudio/${memberData.aiVoice}`
                : '';

            setFormvalue({
                ...memberData,
                memberImage: imageUrl,
                aiVoice: aiVoiceUrl,
            });
        }
    }, [memberData]);

    const handlechange = (e) => {
        setErrors({})
        const { name, value } = e.target;
        setFormvalue({ ...formvalue, [name]: value });
    }

    const onChangeValue = async (e) => {
        try {
            setErrors({});
            let errors = {};
            const { name, value, files } = e.target;

            const file = files?.[0];
            if (!file) return;

            const imageExtensions = /\.(gif|jpeg|tiff|png|webp|bmp|jpg|svg)$/i;
            const audioExtensions = /\.(mp3|wav|ogg|m4a|aac)$/i;

            if (name === "memberImage" && !imageExtensions.test(file.name)) {
                errors.memberImage = "Please upload image file (.png, .jpeg, .jpg, etc.) only.";
            }

            if (name === "aiVoice" && !audioExtensions.test(file.name)) {
                errors.aiVoice = "Please upload audio file (.mp3, .wav, etc.) only.";
            }

            if (Object.keys(errors).length > 0) {
                setErrors(errors);
            } else {
                setFormvalue({ ...formvalue, [name]: file });
            }
        } catch (err) {
            console.error("onChangeValue_err", err);
        }
    };

    const handleSelectChange = (selectedOptions) => {
        setFormvalue({
            ...formvalue,
            private: selectedOptions.map(option => option.value)
        });
    };

    const handleCloseModal = () => {
        history.goBack();
        setFormvalue(initialFormValue);
        setErrors({});
    };

    const statusOptions = [
        { value: "phonenumber", label: "phonenumber" },
        { value: "address", label: "address" },
        { value: "city", label: "city" },
        { value: "country", label: "country" },
        { value: "province", label: "province" },
        { value: "postalcode", label: "postalcode" },
    ];

    const handleedit = async () => {
        try {
            let passData = new FormData();

            // Append image file if it's a File object
            if (formvalue.memberImage && typeof formvalue.memberImage === 'object') {
                passData.append("memberImage", formvalue.memberImage);
            }

            // Append audio file if it's a File object
            if (formvalue.aiVoice && typeof formvalue.aiVoice === 'object') {
                passData.append("aiVoice", formvalue.aiVoice);
            }

            const payload = {
                "memberId": formvalue._id,
                "firstname": formvalue.firstname,
                "email": formvalue.email,
                "position": formvalue.position,
                "phonenumber": formvalue.phonenumber,
                "number": formvalue.number,
                "address": formvalue.address,
                "city": formvalue.city,
                "country": formvalue.country,
                "province": formvalue.province,
                "postalcode": formvalue.postalcode,
                "private": formvalue.private
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)
            let { status, loading, error, message, result } = await Editmember(passData);
            if (status) {
                CustomToastHandler({ msg: message })
                setErrors({})
                handleCloseModal()
            } else {
                if (error) {
                    setErrors(error);
                } else if (message) {
                    CustomToastHandler({ msg: message, type: "error" })
                }
            }
        } catch (err) {
            console.log("handleedit__err", err);
        }
    }

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Edit Member</p>
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
                                    id="name"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.firstname}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.firstname}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Email</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="email"
                                    name="email"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.email}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.email}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">position</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="position"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.position}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.position}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Phonenumber</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="number"
                                    name="phonenumber"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.phonenumber}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.phonenumber}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Number</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="number"
                                    name="number"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.number}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.number}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Address</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <textarea name="address"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.address}
                                    onChange={(e) => { handlechange(e) }}
                                >
                                </textarea>
                            </div>
                            <span className="text-danger">{errors.address}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">city</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="city"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.city}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.city}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">country</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="country"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.country}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.country}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">province</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="province"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.province}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.province}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">postalcode</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="postalcode"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.postalcode}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.postalcode}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Private</p>
                            <div className="rp_input_holder rounded-2 px-0">
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.filter(option =>
                                        formvalue.private.includes(option.value)
                                    )}
                                    onChange={handleSelectChange}
                                    isSearchable={false}
                                    classNamePrefix="customselect"
                                    styles={reactSelectStyles}
                                    isMulti
                                />
                            </div>
                            <span className="text-danger">{errors.Private}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Upload Member Image</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="file"
                                    name="memberImage"
                                    accept="image/*"
                                    className="rp_singleInput flex-grow-1"
                                    onChange={(event) => onChangeValue(event)}
                                />
                            </div>

                            <div className="w-50 my-3 d-flex">
                                {typeof formvalue.memberImage == 'object' ? (
                                    <img src={fileObjectUrl(formvalue?.memberImage)} className='w-25 rounded-2' alt='' />
                                ) : (
                                    <img src={formvalue?.memberImage} className='w-25 rounded-2' alt='' />
                                )}
                            </div>
                            <span className="text-danger">{errors.memberImage}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Upload AI Voice Audio</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="file"
                                    name="aiVoice"
                                    accept="audio/*"
                                    className="rp_singleInput flex-grow-1"
                                    onChange={(event) => onChangeValue(event)}
                                />
                            </div>
                            <div className="w-50 my-3 d-flex">

                                {formvalue.aiVoice && (
                                    <audio controls className="w-100"
                                        src={
                                            typeof formvalue.aiVoice === "object"
                                                ? fileObjectUrl(formvalue.aiVoice)
                                                : formvalue.aiVoice
                                        }>
                                        Your browser does not support the audio element.
                                    </audio>
                                )}
                            </div>
                            <span className="text-danger">{errors.aiVoice}</span>
                        </div>

                        <button className="orange_small_primary mt-3" onClick={() => { handleedit() }}>
                            Submit
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};