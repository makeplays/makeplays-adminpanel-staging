import React, { useEffect, useState } from "react";
import ReactSummernote from "react-summernote";
import "react-summernote/dist/react-summernote.css";
import { isEmpty } from "../../lib/isEmpty";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import { useLocation } from 'react-router-dom';
import key from "../../config/index";
import fileObjectUrl from "../../lib/fileObjectUrl";
import { assetUrl } from "../../lib/assetUrl";
import crypto from '../../config/crypto';
import { EditFaq } from '../../api/adminApi'
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";
import AppliesToPills from "../../Components/AppliesToPills";
import { useSport } from "../../context/sportContext";
import { ANSWER_STEPS_HINT, HELP_CATEGORIES } from "../../constant/helpCategories";
import FaqImagesField from "../../Components/FaqImagesField";
var secretKey = crypto.cryptoSecretKey

const initialFormValue = {
    question: "",
    answer: "",
    category: "more",
    video: ""
};

export const EditFaqPage = ({ record }) => {
    const history = useHistory();
    const [formvalue, setFormvalue] = useState(initialFormValue);
    // Saved images are kept as the raw stored values (so legacy filenames round-
    // trip unchanged); newImages are picked files not uploaded yet.
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [errors, setErrors] = useState({});
    // Editable here: an FAQ is a standalone list entry, so moving it between
    // All Sports and one sport only changes who sees that row.
    const [allSports, setAllSports] = useState(false);
    const { sportId } = useSport();
    const location = useLocation();
    const faqData = location.state.record || {};

    useEffect(() => {
        if (faqData) {
            const videoUrl = assetUrl(faqData.video, `${key.IMAGE_URL}/Faq/`);

            setFormvalue({
                ...faqData,
                category: faqData.category || "more",
                video: videoUrl
            });
            setExistingImages(
                Array.isArray(faqData.images) && faqData.images.length
                    ? faqData.images
                    : (faqData.image ? [faqData.image] : [])
            );
            setAllSports(!faqData.sportId);
        }
    }, [faqData]);

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

    const handleSubmit = async () => {
        try {
            let passData = new FormData();
            newImages.forEach((file) => passData.append("images", file));

            if (formvalue.video instanceof File) {
                passData.append("video", formvalue.video);
            }

            const payload = {
                faqId: formvalue._id,
                question: formvalue.question,
                answer: formvalue.answer,
                category: formvalue.category || "more",
                // the saved images the admin kept, in order; new files are appended
                existingImages,
                allSports,
                // keep the row on its own sport; fall back to the active one
                // for a row that was All Sports and is being scoped now
                sportId: formvalue?.sportId ?? sportId,
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)
            let { status, loading, error, message } = await EditFaq(passData);
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
            console.log("handleSubmit__err", err);
        }
    };

    const handleCloseModal = () => {
        setFormvalue(initialFormValue);
        setExistingImages([]);
        setNewImages([]);
        setErrors({});
        history.push("/faq")
    };

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Edit FAQ</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">
                        <AppliesToPills
                            allSports={allSports}
                            onChange={setAllSports}
                            sportName={formvalue?.sportName}
                            allSportsHint={"Shown to every sport, alongside each sport's own FAQs."}
                        />

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
                            <p className="rp_label mb-2">Help Centre category</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <select
                                    name="category"
                                    className="rp_singleInput flex-grow-1 w-100"
                                    value={formvalue.category}
                                    onChange={(e) => { handlechange(e) }}
                                >
                                    {HELP_CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <small className="text-muted">Where this answer appears in the app. Users browse by category before they search.</small>
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
                                    placeholder={"1. Open the event\n2. Tap Edit\n3. Save"}
                                />
                            </div>
                            <small className="text-muted d-block mt-1">{ANSWER_STEPS_HINT}</small>
                            <span className="text-danger">{errors.answer}</span>
                        </div>

                        <FaqImagesField
                            existing={existingImages}
                            files={newImages}
                            resolve={(value) => assetUrl(value, `${key.IMAGE_URL}/Faq/`)}
                            onChange={({ existing, files }) => { setExistingImages(existing); setNewImages(files); }}
                            onError={(message) => setErrors(message ? { image: message } : {})}
                            error={errors.image}
                        />

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
                            {formvalue?.video && (
                                <div className="w-100 my-3 d-flex">
                                    {formvalue.video instanceof File ? (
                                        <video
                                            src={URL.createObjectURL(formvalue.video)}
                                            className="w-50 rounded-2"
                                            controls
                                            muted
                                        />
                                    ) : (
                                        <video
                                            src={formvalue.video}
                                            className="w-25 rounded-2"
                                            controls
                                            muted
                                        />
                                    )}
                                </div>
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