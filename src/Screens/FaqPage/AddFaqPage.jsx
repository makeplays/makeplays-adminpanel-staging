import React, { useEffect, useState } from "react";
import ReactSummernote from "react-summernote";
import "react-summernote/dist/react-summernote.css";
import { isEmpty } from "../../lib/isEmpty";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import fileObjectUrl from "../../lib/fileObjectUrl";
import crypto from '../../config/crypto';
import { AddFaq } from '../../api/adminApi'
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";

var secretKey = crypto.cryptoSecretKey

const initialFormValue = {
    question: "",
    answer: "",
    image: "",
    video: ""
};

export const AddFaqPage = ({ record }) => {
    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});
    const history = useHistory();

    const handlechange = (e) => {
        setErrors({})
        const { name, value } = e.target;
        setFormvalue({ ...formvalue, [name]: value });
    }

    const handleFileChange = (e) => {
        setErrors({});
        const { name, files } = e.target;
        let error = {};

        if (!files || !files[0]) return;

        if (name === "image") {
            if (!/\.(png|jpeg|jpg|webp)$/i.test(files[0].name)) {
                error.image = "Please upload image (.png, .jpeg, .jpg, .webp)";
            }
        }

        if (name === "video") {
            if (!/\.(mp4|mov|avi|mkv)$/i.test(files[0].name)) {
                error.video = "Please upload video (.mp4, .mov, .avi)";
            }
        }

        if (!isEmpty(error)) {
            setErrors(error);
        } else {
            setFormvalue({ ...formvalue, [name]: files[0] });
        }
    };

    const validation = () => {
        let errors = {};
        if (isEmpty(formvalue?.question)) {
            errors.question = "Question field is required";
        }
        if (isEmpty(formvalue?.answer)) {
            errors.answer = "Answer field is required";
        }
        return errors
    }

    const handleSubmit = async () => {
        try {
            var value = validation()
            if (!isEmpty(value)) {
                setErrors(value)
                return;
            }

            let passData = new FormData();
            if (formvalue.image && typeof formvalue.image === 'object') {
                passData.append("image", formvalue.image);
            }

            if (formvalue.video instanceof File) {
                passData.append("video", formvalue.video);
            }

            const payload = {
                question: formvalue.question,
                answer: formvalue.answer
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)

            let { status, loading, error, message } = await AddFaq(passData);
            if (status) {
                CustomToastHandler({ msg: message })
                setErrors({})
                handleCloseModal();
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

    const handleCloseModal = () => {
        setFormvalue(initialFormValue);
        setErrors({});
        history.push("/faq")
    };

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Add FAQ</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Question</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="question"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.question}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter question"
                                />
                            </div>
                            <span className="text-danger">{errors.question}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Answer</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <textarea
                                    name="answer"
                                    className="rp_singleInput w-100  flex-grow-1"
                                    rows="4"
                                    value={formvalue.answer}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter answer"
                                />
                            </div>
                            <span className="text-danger">{errors.answer}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Image</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    className="rp_singleInput flex-grow-1"
                                    onChange={(event) => handleFileChange(event)}
                                />
                            </div>
                            {formvalue?.image ? (
                                <div className="w-100 my-3 d-flex">
                                    {typeof formvalue.image === "object" ? (
                                        <img
                                            src={fileObjectUrl(formvalue.image)}
                                            className="w-25 rounded-2"
                                            alt="Sport Logo Preview"
                                        />
                                    ) : (
                                        <img
                                            src={formvalue.image}
                                            className="w-25 rounded-2"
                                            alt="Sport Logo"
                                        />
                                    )}
                                </div>
                            ) : null}
                            <span className="text-danger">{errors.image}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Video</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="file"
                                    name="video"
                                    accept="video/*"
                                    className="rp_singleInput flex-grow-1"
                                    onChange={(event) => handleFileChange(event)}
                                />
                            </div>

                            {formvalue.video && (
                                <video
                                    src={fileObjectUrl(formvalue.video)}
                                    className="w-25 mt-3 rounded-2"
                                    controls
                                />
                            )}
                            <span className="text-danger">{errors.video}</span>
                        </div>

                        <button className="orange_small_primary mt-3" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};