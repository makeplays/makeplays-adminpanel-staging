import React, { useEffect, useState } from "react";
import ReactSummernote from "react-summernote";
import "react-summernote/dist/react-summernote.css";
import { isEmpty } from "../../lib/isEmpty";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import fileObjectUrl from "../../lib/fileObjectUrl";
import crypto from '../../config/crypto';
import { AddSports } from '../../api/sportApi'
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";

var secretKey = crypto.cryptoSecretKey

const initialFormValue = {
    name: "",
    image: "",
    description: "",
    rulesAndRegulations: ""
};

export const AddSportPage = ({ record }) => {
    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});
    const history = useHistory();

    const handlechange = (e) => {
        setErrors({})
        const { name, value } = e.target;
        setFormvalue({ ...formvalue, [name]: value });
    }

    const handleEdit = (e) => {
        try {
            setFormvalue((prevFormValue) => ({
                ...prevFormValue,
                rulesAndRegulations: e,
            }));
        } catch (err) {
            console.log("handleEdit__err", err);
        }
    }

    const handleImageChange = (e) => {
        setErrors({})
        let errors = {};
        var { name, value, files } = e.target;
        if (!/\.(gif|jpeg|tiff|png|webp|bmp|jpg)$/i.test(files[0]?.name)) {
            errors.image =
                "Please upload file having extensions  .png,.jpeg,.jpg only.";
        }
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
        } else {
            if (name === "image") {
                setFormvalue({ ...formvalue, [name]: files[0] });
            }
        }
    };

    const validation = () => {
        let errors = {};
        let allowedExtensions = /\.(gif|jpeg|tiff|png|webp|bmp|jpg)$/i;
        if (isEmpty(formvalue?.name)) {
            errors.name = "Name field is required";
        }

        if (!formvalue?.image || !(formvalue.image instanceof File)) {
            errors.image = "Image field is required";
        } else {
            // validate file extension
            if (!allowedExtensions.test(formvalue.image.name)) {
                errors.image = "Please upload file having extensions .png, .webp, .jpg only.";
            }
        }

        if (isEmpty(formvalue?.description)) {
            errors.description = "Description field is required";
        }
        if (isEmpty(formvalue?.rulesAndRegulations)) {
            errors.rulesAndRegulations = "Rules and Regulations field is required";
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

            const payload = {
                "name": formvalue.name,
                "description": formvalue.description,
                "rulesAndRegulations": formvalue.rulesAndRegulations
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)

            let { status, loading, error, message } = await AddSports(passData);
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
        history.push("/sports")
    };

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Add Sports</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Sport Name</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="name"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.name}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter Sport Name"
                                />
                            </div>
                            <span className="text-danger">{errors.name}</span>
                        </div>

                        {/* Sport Description */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Sport Description</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <textarea
                                    name="description"
                                    className="rp_singleInput w-100  flex-grow-1"
                                    rows="4"
                                    value={formvalue.description}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter Sport Description"
                                />
                            </div>
                            <span className="text-danger">{errors.description}</span>
                        </div>

                        {/* Sport rulesAndRegulations */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Sport Rules and Regulations</p>
                            <div className="custom_reactSummerNote">

                                <ReactSummernote
                                    value={formvalue?.rulesAndRegulations}
                                    name="rulesAndRegulations"
                                    options={{
                                        height: 250,
                                        dialogsInBody: true,
                                        disableDragAndDrop: false,
                                        toolbar: [
                                            //   ["style", ["style"]],
                                            ["font", ["bold", "underline", "clear"]],
                                            //   ["fontname", ["fontname"]],
                                            ["para", ["ul", "ol", "paragraph"]],
                                            // ["table", ["table"]],
                                            // ["insert", ["link", "picture", "video"]],
                                            ["view", ["codeview"]],
                                        ],
                                    }}
                                    onChange={handleEdit}
                                />
                            </div>
                            <span className="text-danger">{errors.rulesAndRegulations}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Sport Logo</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    className="rp_singleInput flex-grow-1"
                                    onChange={(event) => handleImageChange(event)}
                                />
                            </div>
                            {formvalue?.image ? (
                                <div className="w-50 my-3 d-flex">
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

                        <button className="orange_small_primary mt-3" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};