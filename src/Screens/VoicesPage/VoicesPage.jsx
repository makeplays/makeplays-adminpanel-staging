import React, { useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Papa from "papaparse";
import { FaLink } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { listAllVoices, UpdateSelectedVoices } from '../../api/adminApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import VoiceActionModels from "../../Modals/VoiceActionModels";
import { isEmpty } from "../../lib/isEmpty";

const VoicePage = () => {

    const [voiceList, setVoiceList] = useState();
    const [pageNumer, setPageNumer] = useState(1);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(0);
    const history = useHistory();
    const [errors, setErrors] = useState({});
    const [fileName, setFileName] = useState();
    const [fileValues, setFileValues] = useState();
    const [showAudioModal, setShowAudioModal] = useState(false);
    const [selectedAudioRecord, setSelectedAudioRecord] = useState(null);
    const [selectedVoiceIds, setSelectedVoiceIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [showAction, setShowAction] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const handleCheckboxChange = (voiceId) => {
        setIsEdit(true)
        setSelectedVoiceIds((prev) =>
            prev.includes(voiceId) ? prev.filter(id => id !== voiceId) : [...prev, voiceId]
        );
    };

    const columns = [
        {
            key: "action",
            text: "Action",
            sortable: false,
            cell: (record, index) => (
                <input
                    type="checkbox"
                    className="checkboxBG"
                    onChange={() => handleCheckboxChange(record.voice_id)}
                    checked={selectedVoiceIds.includes(record.voice_id)} />
            ),
        },
        {
            key: "sno",
            text: "S.No",
            className: "w_100 text-center",
            align: "center",
            sortable: false,
            cell: (record, index) => {
                return <p className="">{index + 1}</p>
            },
        },
        {
            key: "voiceId",
            text: "Voice ID",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.voice_id ? record.voice_id : "--"}</p>
            ),
        },
        {
            key: "name",
            text: "name",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.name ? record.name : "--"}</p>
            ),
        },
        {
            key: "language",
            text: "Language",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.labels?.language ? record?.labels?.language : "--"}</p>
            ),
        },
        {
            key: "accent",
            text: "Accent",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.labels?.accent ? record?.labels?.accent : "--"}</p>
            ),
        },
        {
            key: "description",
            text: "Description",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.description ? record.description : "--"}</p>
            ),
        },
        {
            key: "preview_url",
            text: "Preview URL",
            sortable: true,
            cell: (record, index) => (
                <div className="d-flex align-items-center justify-content-center">
                    {record?.preview_url ? (
                        <button
                            className="table_extrabtns p-2"
                            onClick={() =>
                                window.open(record.preview_url, "_blank", "noopener,noreferrer")
                            }
                        >
                            <FaLink />
                        </button>
                    ) : (
                        <p className="text-center">No URL</p>
                    )}
                </div>
            ),
        },
        {
            key: "image",
            text: "Preview Image",
            sortable: false,
            cell: (record) => {
                if (record?.image && record?.image != "undefined") {
                    return (
                        <div className="tableImgViewCard">
                            <img
                                src={`${key.IMAGE_URL}/AiImage/${record.image}`}
                            />{" "}
                        </div>
                    );
                } else {
                    return <span>--</span>;
                }
            },
        },
        {
            key: "action",
            text: "Image Action",
            sortable: true,
            cell: (record, index) => (
                <div className="d-flex align-items-center justify-content-center">
                    <button
                        className="table_extrabtns activeBtn"
                        onClick={() => {
                            setSelectedRecord(record);
                            setShowAction(true)
                        }}>
                        {/* <img
                            src={require("../../assets/images/editer.svg").default}
                            className="img-fluid table_activity_img"
                        />{" "} */}
                        upload Image
                    </button>
                </div>
            ),
        },

    ]

    useEffect(() => {
        getAllVoices();
    }, []);

    const getAllVoices = async (reqData) => {
        try {
            let { status, loading, error, message, result, count } = await listAllVoices(reqData);
            if (status) {
                setVoiceList(result);
                setCount(count)

                // Sync selectedVoiceIds with backend preferences
                const alreadySelected = result
                    .filter(v => v.preference === true)
                    .map(v => v.voice_id);

                setSelectedVoiceIds(prev => {
                    const merged = new Set([...prev, ...alreadySelected]);
                    return Array.from(merged);
                });
            } else {
                if (error) {
                } else if (message) {
                }
            }
        } catch (err) {
            console.log("getAllVoices__err", err);
        }
    };

    const address_showing = (item) => {
        if (item && item.toString().length > 10) {
            var slice_front = item.slice(0, 9);
            var slice_end = item.slice(item.length - 9, item.length + 1);
            return slice_front + "...." + slice_end;
        } else return item;
    };

    const handlePagination = async (index) => {
        let reqData = {
            page: index.page_number,
            limit: index.page_size,
            search: index.filter_value,
        };
        getAllVoices(reqData)
        setPageNumer(index.page_number);
        setLimit(index.page_size);
    };

    const [showPreview, setShowPreview] = useState(false);
    const handleshowPreview = () => setShowPreview(true);
    const handleCloseAddUsers = () => setShowPreview(false);

    // edid Exchange modal
    const [showEditUser, setShowEditUser] = useState(false);
    const [editRecord, setEditRecord] = useState();
    const [deleteRecord, setDeleteRecord] = useState({});

    const handleShowEditUser = (record) => {
        setEditRecord(record);
        setShowEditUser(true);
        history.push("/members/edit", { record: record })
    };

    const handleCloseEditUser = () => {
        setShowEditUser(false);
        setEditRecord({});
    };

    const loginNavigateHandle = () => {
        history.push("/login-users")
    };

    const audioPreviewHandle = (record) => {
        setSelectedAudioRecord(record);
        handleshowPreview();
    }

    const handleCloseAudioModal = () => {
        setShowAudioModal(false);
        setSelectedAudioRecord(null);
    };
    // delete Exchange modal

    const [showDeleteUsers, setShowDeleteUsers] = useState(false);

    const handleShowDeleteUsers = (record) => {
        setDeleteRecord(record);
        setShowDeleteUsers(true);
    };
    const handleCloseDeleteUsers = () => setShowDeleteUsers(false);

    const changeHandler = async (event) => {
        let splitFile = event.target.files[0].name.split(".");
        if (splitFile[splitFile.length - 1] != "csv") {
            return false;
        }

        const valuesArray = [];
        setFileName(event.target.files[0].name);
        Papa.parse(event.target.files[0], {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                results.data.map((d) => {
                    valuesArray.push(Object.values(d));
                });
                // Filtered Values
                setFileValues(valuesArray);

            },
        });

    };

    const config = {
        page_size: 10,
        length_menu: [10, 20, 50],
        filename: "Emailtemplates",
        no_data_text: "No Email Templates found!",
        language: {
            length_menu: "Show _MENU_ result per page",
            filter: "Filter by Voice ID...",
            info: "Showing _START_ to _END_ of _TOTAL_ records",
            pagination: {
                first: "First",
                previous: "Previous",
                next: "Next",
                last: "Last",
            },
        },
        show_length_menu: false,
        show_filter: true,
        show_pagination: true,
        show_info: false,
    };

    const extraButtons = [
        {
            className: "btn btn-primary buttons-pdf",
            title: "Export TEst",
            children: [
                <span>
                    <i
                        className="glyphicon glyphicon-print fa fa-print"
                        aria-hidden="true"></i>
                </span>,
            ],
            onClick: (event) => { },
        },
        {
            className: "btn btn-primary buttons-pdf",
            title: "Export TEst",
            children: [
                <span>
                    <i
                        className="glyphicon glyphicon-print fa fa-print"
                        aria-hidden="true"></i>
                </span>,
            ],
            onClick: (event) => { },
            onDoubleClick: (event) => { },
        },
    ];

    const submitSelectedVoices = async () => {
        try {
            const { status, loading, error, message } = await UpdateSelectedVoices({ selectedVoiceIds: selectedVoiceIds });
            setIsEdit(false)
            if (status) {
                CustomToastHandler({ msg: message })
                setErrors({})
            } else {
                if (error) {
                    setErrors(error);
                } else if (message) {
                    CustomToastHandler({ msg: message, type: "error" })
                }
            }
        } catch (err) {
            console.error(err);
        }
        finally {
            setIsSubmitting(false); // re-enable button after backend responds
        }
    };

    return (
        <>
            <VoiceActionModels
                show={showAction}
                handleClose={() => setShowAction(false)}
                record={selectedRecord}
                getAllVoices={getAllVoices}
            />
            <Container fluid className="common_bg position-relative">
                <div className="liner"></div>
                <Row>
                    <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
                        <Sidebar />
                    </Col>
                    <Col xl={10} lg={12}>
                        <Header title={"Voices"} />

                        <div className="rp_singleinput_holder mb-3">
                        </div>
                        <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                            <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                                {isEdit ? <button
                                    className="exchange_tableFileUploader table_extrabtns mt-4 ms-4"
                                    onClick={submitSelectedVoices}
                                    disabled={!isEdit} // only disable while submitting
                                >
                                    <p className="cmn_extraBtnsLabel m-0">Submit</p>
                                </button> : ""}

                                <ReactDatatable
                                    config={config}
                                    records={voiceList}
                                    columns={columns}
                                    extraButtons={extraButtons}
                                    dynamic={true}
                                    total_record={count}
                                    onChange={(e) => {
                                        handlePagination(e);
                                    }}
                                    filterRecords={(e) => { }}
                                    filterData={(e) => { }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default VoicePage;
