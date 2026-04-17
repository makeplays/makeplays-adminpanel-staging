import React, { useEffect, useState } from "react";
import Select from "react-select";
import { isEmpty } from "../../lib/isEmpty";
import { reactSelectStyles } from "../../constant/staticData";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DashboardLayout } from "../../Layouts/dashboardLayout";

const initialFormValue = {
    eventName: "",
    sport: "",
    country: "",
    organizer: "",
    eventDate: "",
    duration: "",
};

export const AddEventsPage = ({ record }) => {
    const history = useHistory();
    const [formvalue, setFormvalue] = useState(initialFormValue);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...formvalue, [name]: value };
        setFormvalue(updated);
        setErrors(validation(updated));
    };

    const handleSelectChange = (selected) => {
        const updated = { ...formvalue, sport: selected.value };
        setFormvalue(updated);
        setErrors(validation(updated));
    };

    const validation = (values) => {
        const error = {};
        if (isEmpty(values.eventName)) error.eventName = "Field is required";
        if (isEmpty(values.organizer)) error.organizer = "Field is required";
        if (isEmpty(values.eventDate)) error.eventDate = "Field is required";
        if (isEmpty(values.country)) error.country = "Field is required";
        if (isEmpty(values.sport)) error.sport = "Field is required";
        if (isEmpty(values.duration)) error.duration = "Field is required";
        return error;
    };


    const handleSubmit = async () => {
        const errs = validation(formvalue);
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        const payload = {
            _id: record?._id,
            eventName: formvalue.eventName,
            sport: formvalue.sport,
            country: formvalue.country,
            organizer: formvalue.organizer,
            eventDate: formvalue.eventDate,
            duration: formvalue.duration,
        };

        console.log("Payload to submit:", payload);
        // Submit logic here...
    };


    const handleCloseModal = () => {
        history.goBack();
        setFormvalue(initialFormValue);
        setErrors({});
    };

    const statusOptions = [
        { value: "Soccer", label: "Soccer" },
        { value: "Basketball", label: "Basketball" },
        { value: "Baseball", label: "Baseball" },
        { value: "American Football", label: "American Football" },
        { value: "Tennis", label: "Tennis" },
        { value: "Cricket", label: "Cricket" },
    ];

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer">
                    <div className="cmn_modal_header d-flex justify-content-between align-items-center">
                        <p className="cmn_modal_title">Add Event</p>
                        <button className="backBtn" onClick={handleCloseModal}>
                            Back
                        </button>
                    </div>

                    <div className="mt-4">
                        {/* Event Name */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Event Name</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="eventName"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.eventName}
                                    onChange={handleChange}
                                    placeholder="Enter Event Name"
                                />
                            </div>
                            <span className="text-danger">{errors.eventName}</span>
                        </div>

                        {/* Organizer */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Organizer</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="organizer"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.organizer}
                                    onChange={handleChange}
                                    placeholder="Enter Organizer Name"
                                />
                            </div>
                            <span className="text-danger">{errors.organizer}</span>
                        </div>

                        {/* Event Date */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Event Date</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="date"
                                    name="eventDate"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.eventDate}
                                    onChange={handleChange}
                                />
                            </div>
                            <span className="text-danger">{errors.eventDate}</span>
                        </div>

                        {/* Country */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Country</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="text"
                                    name="country"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.country}
                                    onChange={handleChange}
                                    placeholder="Enter Country"
                                />
                            </div>
                            <span className="text-danger">{errors.country}</span>
                        </div>

                        {/* Sport */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Sport</p>
                            <div className="rp_input_holder px-0">
                                <Select
                                    name="sport"
                                    options={statusOptions}
                                    onChange={handleSelectChange}
                                    value={statusOptions.find(opt => opt.value === formvalue.sport)}
                                    classNamePrefix="customselect"
                                    placeholder="Select Sport"
                                    styles={reactSelectStyles}
                                />
                            </div>
                            <span className="text-danger">{errors.sport}</span>
                        </div>

                        {/* Duration */}
                        <div className="rp_singleinput_holder mb-3">
                            <p className="rp_label mb-2">Duration (in days)</p>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                                <input
                                    type="number"
                                    name="duration"
                                    className="rp_singleInput flex-grow-1"
                                    value={formvalue.duration}
                                    onChange={handleChange}
                                    placeholder="Enter Duration"
                                />
                            </div>
                            <span className="text-danger">{errors.duration}</span>
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