import React, { useEffect, useState } from "react";
import { isEmpty } from "../../lib/isEmpty";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import crypto from '../../config/crypto';
import { AddSports } from '../../api/sportApi'
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";
var secretKey = crypto.cryptoSecretKey

const initialFormValue = {
    name: "",
    image: "",
    description: ""
};
export const AddVoiceTemplatePage = ({ record }) => {
    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});
    const history = useHistory();

    const handlechange = (e) => {
        setErrors({})
        const { name, value } = e.target;
        setFormvalue({ ...formvalue, [name]: value });
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

    const handleSubmit = async () => {
        try {
            let passData = new FormData();
            if (formvalue.image && typeof formvalue.image === 'object') {
                passData.append("image", formvalue.image);
            }

            const payload = {
                "name": formvalue.name,
                "description": formvalue.description
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
            // }
        } catch (err) {
            console.log("handleSubmit__err", err);
        }
    };

    const handleCloseModal = () => {
        setFormvalue(initialFormValue);
        setErrors({});
        history.push("/voice-template")
    };
    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Add Voice Template</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Title</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="name"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.name}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter Voice Name"
                                />
                            </div>
                            <span className="text-danger">{errors.name}</span>
                        </div>

                        {/* Sport Description */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Content</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <textarea
                                    name="description"
                                    className="rp_singleInput w-100  flex-grow-1"
                                    rows="4"
                                    value={formvalue.description}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter Voice Description"
                                />
                            </div>
                            <span className="text-danger">{errors.description}</span>
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