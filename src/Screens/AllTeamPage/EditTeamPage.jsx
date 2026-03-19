import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useLocation } from 'react-router-dom';
import { isEmpty } from "../../lib/isEmpty";
import { reactSelectStyles } from "../../constant/staticData";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import key from "../../config/index";
import fileObjectUrl from "../../lib/fileObjectUrl";
import crypto from '../../config/crypto';
import { EditTeams, getSports } from '../../api/teamApi'
import { Customdecryptdata, Customencryptdata } from '../../lib/CustomData';
import { CustomToastHandler } from "../../hooks/useCustomToast";
var secretKey = crypto.cryptoSecretKey

export const EditTeamPage = ({ handleClose, record }) => {
    const history = useHistory();
    const initialFormValue = {
        teamName: "",
        ageCriteria: "",
        sportId: "",
        leagueOrClubName: "",
        country: "",
        state: "",
        city: "",
        teamLogo: ""
    };
    const [errors, setErrors] = useState({});
    const [formValue, setFormValue] = useState(initialFormValue);
    const [statusOptions, setStatusOptions] = useState([]);
    const location = useLocation();
    const teamData = location.state.record || {};

    useEffect(() => {
        if (teamData) {
            const imageUrl = teamData.teamLogo
                ? `${key.IMAGE_URL}/Team/${teamData.teamLogo}`
                : '';

            setFormValue({
                ...teamData,
                teamLogo: imageUrl,
            });
        }
    }, [teamData]);

    const handlechange = (e) => {
        setErrors({})
        const { name, value } = e.target;
        setFormValue({ ...formValue, [name]: value });
    }

    const onChangeValue = async (e) => {
        try {
            setErrors({})
            let errors = {};
            var { name, value, files } = e.target;
            if (!/\.(gif|jpeg|tiff|png|webp|bmp|jpg)$/i.test(files[0]?.name)) {
                errors.teamLogo =
                    "Please upload file having extensions  .png,.jpeg,.jpg only.";
            }
            if (Object.keys(errors).length > 0) {
                setErrors(errors);
            } else {
                if (name === "teamLogo") {
                    setFormValue({ ...formValue, [name]: files[0] });
                }
            }
        } catch (err) {
            console.log("onChangeValue__err", err);
        }
    };

    const handleSelectChange = (selectedOption) => {
        if (!selectedOption) return;

        // Update form value
        setFormValue((prev) => ({
            ...prev,
            sportId: {
                _id: selectedOption.value,
                name: selectedOption.label
            }
        }));
    };

    const handleedit = async () => {
        try {
            let passData = new FormData();
            if (formValue.teamLogo && typeof formValue.teamLogo === 'object') {
                passData.append("teamLogo", formValue.teamLogo);
            }

            const payload = {
                "teamId": formValue._id,
                "teamName": formValue.teamName,
                "ageCriteria": formValue.ageCriteria,
                "sportId": formValue.sportId,
                "leagueOrClubName": formValue.leagueOrClubName,
                "country": formValue.country,
                "state": formValue.state,
                "city": formValue.city
            }
            const encryptedData = Customencryptdata(payload, secretKey)
            passData.append("token", encryptedData)
            let { status, loading, error, message, result } = await EditTeams(passData);
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

    useEffect(() => {
        listSports();
    }, []);

    const listSports = async () => {
        try {
            let { status, loading, error, message, result } = await getSports();
            if (status) {
                const formattedOptions = result.map(item => ({
                    value: item._id,
                    label: item.name
                }));
                setStatusOptions(formattedOptions);

            } else {
                if (error) {
                    setErrors(error);
                } else if (message) {
                }
            }
        } catch (err) {
            console.log("listSports__err", err);
        }
    };

    const handleCloseModal = () => {
        setFormValue(initialFormValue);
        setErrors({});
        history.goBack();
    };
    return (

        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div>
                        <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                            <p className="cmn_modal_title">Edit Team</p>
                            <button className="backBtn" onClick={handleCloseModal}>
                                Back
                            </button>
                        </div>

                        <div className="mt-4">
                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">Team Name</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input
                                        type="text"
                                        name="teamName"
                                        className="rp_singleInput flex-grow-1"
                                        value={formValue.teamName}
                                        onChange={(e) => { handlechange(e) }}
                                    />
                                </div>
                                <span className="text-danger">{errors.teamName}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">Age Criteria</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input
                                        type="text"
                                        name="ageCriteria"
                                        className="rp_singleInput flex-grow-1"
                                        value={formValue.ageCriteria}
                                        onChange={(e) => { handlechange(e) }}
                                    />
                                </div>
                                <span className="text-danger">{errors.ageCriteria}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">Sports</p>
                                <div className="rp_input_holder rounded-2 px-0">
                                    <Select
                                        options={statusOptions}
                                        onChange={handleSelectChange}
                                        value={
                                            statusOptions.find(
                                                (opt) => opt.value === formValue?.sportId?._id
                                            ) || null
                                        } isSearchable={true}
                                        classNamePrefix="customselect"
                                        styles={reactSelectStyles}
                                    />
                                </div>
                                <span className="text-danger">{errors.sportId}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">League Name</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input
                                        type="text"
                                        name="leagueOrClubName"
                                        className="rp_singleInput flex-grow-1"
                                        value={formValue.leagueOrClubName}
                                        onChange={(e) => { handlechange(e) }}
                                    />
                                </div>
                                <span className="text-danger">{errors.leagueOrClubName}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">Country</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input
                                        type="text"
                                        name="country"
                                        className="rp_singleInput flex-grow-1"
                                        value={formValue.country}
                                        onChange={(e) => { handlechange(e) }}
                                    />
                                </div>
                                <span className="text-danger">{errors.country}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">State</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input
                                        type="text"
                                        name="state"
                                        className="rp_singleInput flex-grow-1"
                                        value={formValue.state}
                                        onChange={(e) => { handlechange(e) }}
                                    />
                                </div>
                                <span className="text-danger">{errors.state}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">City</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input
                                        type="text"
                                        name="city"
                                        className="rp_singleInput flex-grow-1"
                                        value={formValue.city}
                                        onChange={(e) => { handlechange(e) }}
                                    />
                                </div>
                                <span className="text-danger">{errors.city}</span>
                            </div>

                            <div className="rp_singleinput_holder mb-3">
                                <p className="rp_label mb-2">Team Logo</p>
                                <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                    <input type='file' name="teamLogo" id="onChangeValue" placeholder='teamLogo' className='rp_singleInput rp_singleFileInput flex-grow-1'
                                        onChange={(event) => onChangeValue(event)}
                                    />
                                </div>
                                <div className="w-50 my-3 d-flex">
                                    {typeof formValue.teamLogo == 'object' ? (
                                        <img src={fileObjectUrl(formValue?.teamLogo)} className='w-25 rounded-2' alt='' />
                                    ) : (
                                        <img src={formValue?.teamLogo} className='w-25 rounded-2' alt='' />
                                    )}
                                </div>
                                <span className="text-danger">{errors.teamLogo}</span>
                            </div>

                            <button className="orange_small_primary mt-3" onClick={() => { handleedit() }}>
                                Submit
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};