import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useLocation } from 'react-router-dom';
import { isEmpty } from "../../lib/isEmpty";
import { reactSelectStyles } from "../../constant/staticData";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { getOpponetTeams, EditEvent } from '../../api/eventApi'

const initialformValue = {
    eventType: "",
    maxPlayers: "",
    date: "",
    duration: "",
    location: "",
    homeOrAway: "",
    opponent: "",
    time: "",
    arrive: "",
    uniform: "",
    notes: "",
    notifyTeam: ""
};
export const EditEventsPage = ({ record }) => {
    const history = useHistory();
    const [formValue, setformValue] = useState(initialformValue);
    const [errors, setErrors] = useState({});
    const location = useLocation();
    const [statusOptions, setStatusOptions] = useState([]);
    const eventData = location.state.record || {};

    useEffect(() => {
        if (eventData) {
            setformValue({
                ...eventData
            });
        }
    }, [eventData]);

    const handlechange = (e) => {
        setErrors({})
        const { name, value } = e.target;
        setformValue({ ...formValue, [name]: value });
    }

    const handleedit = async () => {
        try {
            let { status, loading, error, message, result } = await EditEvent(formValue);
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

    const handleCloseModal = () => {
        history.goBack();
        setformValue(initialformValue);
        setErrors({});
    };

    useEffect(() => {
        listOpponetTeams(formValue);
    }, [formValue]);

    const listOpponetTeams = async (formValue) => {
        try {
            const data = {
                teamId: formValue?.teamId?._id
            }
            let { status, loading, error, message, result } = await getOpponetTeams(data);
            if (status) {
                const formattedOptions = result.map(item => ({
                    value: item._id,
                    label: item.teamName
                }));
                setStatusOptions(formattedOptions);

            } else {
                if (error) {
                    setErrors(error);
                } else if (message) {
                }
            }
        } catch (err) {
            console.log("listOpponetTeams__err", err);
        }
    };

    const handleSelectChange = (field, selectedOption) => {
        setformValue(prev => ({
            ...prev,
            [field]: selectedOption?.value
        }));
    };

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Edit Event</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Event Type</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="eventType"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.eventType}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter Event Name"
                                />
                            </div>
                            <span className="text-danger">{errors.eventType}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Max Players</p>
                            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
                                <input
                                    type="text"
                                    name="maxPlayers"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.maxPlayers}
                                    onChange={(e) => { handlechange(e) }}
                                />
                            </div>
                            <span className="text-danger">{errors.maxPlayers}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">date</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="date"
                                    name="date"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.date}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter date Name"
                                />
                            </div>
                            <span className="text-danger">{errors.date}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Duration</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="duration"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.duration}
                                    onChange={(e) => { handlechange(e) }}

                                />
                            </div>
                            <span className="text-danger">{errors.duration}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">location</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="location"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.location}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter location"
                                />
                            </div>
                            <span className="text-danger">{errors.location}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Opponent</p>
                            <div className="rp_input_holder px-0">
                                <Select
                                    name="opponent"
                                    options={statusOptions}
                                    onChange={(selectedOption) => {
                                        handleSelectChange('opponent', selectedOption);
                                    }}
                                    value={statusOptions.find(opt => opt.value === formValue?.opponent?._id)}
                                    classNamePrefix="customselect"
                                    placeholder="Select Opponent"
                                    styles={reactSelectStyles}
                                />
                            </div>
                            <span className="text-danger">{errors.opponent}</span>
                        </div>

                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">time</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="time"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.time}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter time"
                                />
                            </div>
                            <span className="text-danger">{errors.time}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Arrive</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="arrive"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.arrive}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter arrive"
                                />
                            </div>
                            <span className="text-danger">{errors.arrive}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Arrive</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="uniform"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.uniform}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter uniform"
                                />
                            </div>
                            <span className="text-danger">{errors.uniform}</span>
                        </div>
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Notes</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="notes"
                                    className="rp_singleInput flex-grow-1"
                                    value={formValue.notes}
                                    onChange={(e) => { handlechange(e) }}
                                    placeholder="Enter notes"
                                />
                            </div>
                            <span className="text-danger">{errors.notes}</span>
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