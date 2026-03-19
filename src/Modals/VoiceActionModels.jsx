import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import fileObjectUrl from "../lib/fileObjectUrl";
import { isEmpty } from "../lib/isEmpty";
import { CustomToastHandler } from "../hooks/useCustomToast";
import { UploadImage } from '../api/adminApi'
import { Customdecryptdata, Customencryptdata } from '../lib/CustomData';
import crypto from '../config/crypto';
import key from "../config/index";

var secretKey = crypto.cryptoSecretKey

const VoiceActionModels = ({ show, handleClose, onConfirm, record, getAllVoices }) => {

    const [errors, setErrors] = useState({});
    const [formValue, setFormValue] = useState(null);

    useEffect(() => {
        if (!show) {
            setFormValue({});
            setErrors({});
        }
    }, [show]);

    const onChangeValue = async (e) => {
        try {
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
                    setFormValue({ ...formValue, [name]: files[0] });
                }
            }
        } catch (err) {
            console.log("onChangeValue__err", err);
        }
    };

    const validation = () => {
        let errors = {};
        let allowedExtensions = /\.(gif|jpeg|tiff|png|webp|bmp|jpg)$/i;
        if (!formValue?.image || !(formValue.image instanceof File)) {
            errors.image = "Image field is required";
        } else {
            // validate file extension
            if (!allowedExtensions.test(formValue.image.name)) {
                errors.image = "Please upload file having extensions .png, .webp, .jpg only.";
            }
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
            if (formValue.image && typeof formValue.image === 'object') {
                passData.append("image", formValue.image);
            }

            const payload = {
                "_id": record?._id
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)
            let { status, loading, error, message } = await UploadImage(passData);
            if (status) {
                CustomToastHandler({ msg: message })
                setErrors({})
                handleClose()
                getAllVoices()
                window.location.reload();
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
        <Modal
            centered
            className="cmn_modal"
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}>
            <Modal.Body>
                <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                    <p className="cmn_modal_title">Action</p>
                    <button
                        className="cmn_modal_closer rounded-5"
                        onClick={handleClose}>
                        <i class="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="mt-3">
                    <div className="rp_singleinput_holder">
                        <p className="rp_label mt-4">Upload Image</p>
                        <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                            <input type='file' name="image" id="onChangeValue" placeholder='image' className='rp_singleInput rp_singleFileInput flex-grow-1'
                                onChange={(event) => onChangeValue(event)}
                            />
                        </div>

                        {(formValue?.image || record?.image) ? (
                            <div className="w-100 my-3 d-flex justify-content-center">
                                {typeof formValue?.image === "object" ? (

                                    <img src={fileObjectUrl(formValue?.image)} className='w-25 rounded-2' alt='' />
                                ) : record?.image ? (
                                    <img
                                        src={`${key.IMAGE_URL}/AiImage/${record?.image}`}
                                        className="w-25 rounded-2"

                                    />
                                ) : null}
                            </div>
                        ) : null}
                        <span className="text-danger">{errors.image}</span>
                    </div>
                    <div className="d-flex justify-content-center mt-3 gap-2">
                        <button
                            className="secondary_btn w-25"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>

                        <button
                            className="orange_small_primary w-25"
                            onClick={handleSubmit}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default VoiceActionModels