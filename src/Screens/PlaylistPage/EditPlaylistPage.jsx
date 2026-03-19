import React, { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import { EditPlaylist } from '../../api/adminApi'
import fileObjectUrl from "../../lib/fileObjectUrl";
import { Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";
import crypto from '../../config/crypto';

var secretKey = crypto.cryptoSecretKey
const initialFormValue = {
    audioName: "",
    audio: ""
};

export const EditPlaylistPage = () => {
    const history = useHistory();

    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});
    const location = useLocation();
    const playlistData = location.state.record || {};

    useEffect(() => {
        if (playlistData) {
            const audioUrl = playlistData.audio
                ? `${key.IMAGE_URL}/PlayList/${playlistData.audio}`
                : '';

            setFormvalue({
                ...playlistData,
                audio: audioUrl,
            });
        }
    }, [playlistData]);

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
            const audioExtensions = /\.(mp3|wav|ogg|m4a|aac)$/i;

            if (name === "audio" && !audioExtensions.test(file.name)) {
                errors.audio = "Please upload audio file (.mp3, .wav, etc.) only.";
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

    const handleCloseModal = () => {
        history.goBack();
        setFormvalue(initialFormValue);
        setErrors({});
    };

    const handleedit = async () => {
        try {
            let passData = new FormData();

            // Append audio file if it's a File object
            if (formvalue.audio && typeof formvalue.audio === 'object') {
                passData.append("audio", formvalue.audio);
            }

            const payload = {
                "playlistId": formvalue._id,
                "audioName": formvalue.audioName
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)
            let { status, loading, error, message } = await EditPlaylist(passData);
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
                        <p className="cmn_modal_title">Edit Playlist</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Audio Name</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="audioName"
                                    id="audioName"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.audioName}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.audioName}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Upload Audio File</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="file"
                                    name="audio"
                                    accept="audio/*"
                                    className="rp_singleInput flex-grow-1"
                                    onChange={(event) => onChangeValue(event)}
                                />
                            </div>
                            <div className="w-50 my-3 d-flex">

                                {formvalue.audio && (
                                    <audio controls className="w-100"
                                        src={
                                            typeof formvalue.audio === "object"
                                                ? fileObjectUrl(formvalue.audio)
                                                : formvalue.audio
                                        }>
                                        Your browser does not support the audio element.
                                    </audio>
                                )}
                            </div>
                            <span className="text-danger">{errors.audio}</span>
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