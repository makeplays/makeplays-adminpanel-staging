import React, { useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Papa from "papaparse";
import { FaLink, FaPlay } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { listAllVoices, UpdateSelectedVoices } from '../../api/adminApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import VoiceActionModels from "../../Modals/VoiceActionModels";
import { isEmpty } from "../../lib/isEmpty";

const DescriptionCell = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return <p className="text-center">--</p>;
    return (
        <div>
            <p style={{
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                margin: 0,
            }}>
                {text}
            </p>
            <span
                onClick={() => setExpanded(!expanded)}
                style={{ color: '#9D110C', cursor: 'pointer', fontSize: 12 }}
            >
                {expanded ? 'Read less' : 'Read more'}
            </span>
        </div>
    );
};

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
    const [isSyncing, setIsSyncing] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [showAction, setShowAction] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [playingVoiceId, setPlayingVoiceId] = useState(null);

    const handleCheckboxChange = (voiceId) => {
        setIsEdit(true);
        setSelectedVoiceIds((prev) =>
            prev.includes(voiceId) ? prev.filter(id => id !== voiceId) : [...prev, voiceId]
        );
    };

    const allCurrentSelected = voiceList?.length > 0 && voiceList.every(v => selectedVoiceIds.includes(v.voice_id));

    const handleSelectAll = () => {
        setIsEdit(true);
        if (allCurrentSelected) {
            const currentIds = voiceList.map(v => v.voice_id);
            setSelectedVoiceIds(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            const currentIds = voiceList.map(v => v.voice_id);
            setSelectedVoiceIds(prev => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const columns = [
        {
            key: "action",
            text: <input
                type="checkbox"
                className="checkboxBG"
                onChange={handleSelectAll}
                checked={allCurrentSelected}
                title="Select all on this page"
            />,
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
            key: "name",
            text: "Name",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.name ? record.name : "--"}</p>
            ),
        },
        {
            key: "description",
            text: "Description",
            sortable: true,
            cell: (record) => <DescriptionCell text={record?.description} />,
        },
        {
            key: "preview_url",
            text: "Preview",
            sortable: false,
            cell: (record) => {
                if (!record?.preview_url) return <p className="text-center">No URL</p>;
                if (playingVoiceId === record.voice_id) {
                    return (
                        <div className="d-flex flex-column align-items-center gap-1">
                            <audio
                                controls
                                autoPlay
                                src={record.preview_url}
                                onEnded={() => setPlayingVoiceId(null)}
                                style={{ height: 32, width: 160 }}
                            />
                            <span
                                onClick={() => setPlayingVoiceId(null)}
                                style={{ color: '#9D110C', cursor: 'pointer', fontSize: 11 }}
                            >
                                Close
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="d-flex align-items-center justify-content-center">
                        <button
                            className="table_extrabtns p-2"
                            onClick={() => setPlayingVoiceId(record.voice_id)}
                        >
                            <FaPlay />
                        </button>
                    </div>
                );
            },
        },
        {
            key: "image",
            text: "Image",
            sortable: false,
            cell: (record) => {
                if (record?.image && record?.image !== "undefined") {
                    return (
                        <div
                            className="tableImgViewCard"
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setSelectedRecord(record); setShowAction(true); }}
                        >
                            <img src={`${key.IMAGE_URL}/AiImage/${record.image}`} alt="voice" />
                        </div>
                    );
                }
                return (
                    <button
                        className="table_extrabtns activeBtn"
                        onClick={() => { setSelectedRecord(record); setShowAction(true); }}
                    >
                        Upload Image
                    </button>
                );
            },
        },
    ];

    useEffect(() => {
        getAllVoices();
    }, []);

    const getAllVoices = async (reqData) => {
        try {
            let { status, loading, error, message, result, count } = await listAllVoices(reqData);
            if (status) {
                setVoiceList(result);
                setCount(count)

                const alreadySelected = result
                    .filter(v => v.preference === true)
                    .map(v => v.voice_id);

                setSelectedVoiceIds(prev => {
                    const merged = new Set([...prev, ...alreadySelected]);
                    return Array.from(merged);
                });
            }
        } catch (err) {
            console.log("getAllVoices__err", err);
        }
    };

    const handlePagination = async (index) => {
        let reqData = {
            page: index.page_number,
            limit: index.page_size,
            search: index.filter_value,
        };
        getAllVoices(reqData);
        setPageNumer(index.page_number);
        setLimit(index.page_size);
    };

    const [showPreview, setShowPreview] = useState(false);
    const handleshowPreview = () => setShowPreview(true);
    const handleCloseAddUsers = () => setShowPreview(false);

    const [showEditUser, setShowEditUser] = useState(false);
    const [editRecord, setEditRecord] = useState();
    const [deleteRecord, setDeleteRecord] = useState({});

    const handleShowEditUser = (record) => {
        setEditRecord(record);
        setShowEditUser(true);
        history.push("/members/edit", { record: record });
    };

    const handleCloseEditUser = () => {
        setShowEditUser(false);
        setEditRecord({});
    };

    const handleCloseAudioModal = () => {
        setShowAudioModal(false);
        setSelectedAudioRecord(null);
    };

    const [showDeleteUsers, setShowDeleteUsers] = useState(false);
    const handleShowDeleteUsers = (record) => { setDeleteRecord(record); setShowDeleteUsers(true); };
    const handleCloseDeleteUsers = () => setShowDeleteUsers(false);

    const config = {
        page_size: 10,
        length_menu: [10, 50, 100, 200],
        filename: "Emailtemplates",
        no_data_text: "No Email Templates found!",
        language: {
            length_menu: "Show _MENU_ result per page",
            filter: "Filter in voices...",
            info: "Showing _START_ to _END_ of _TOTAL_ records",
            pagination: {
                first: "First",
                previous: "Previous",
                next: "Next",
                last: "Last",
            },
        },
        show_length_menu: true,
        show_filter: true,
        show_pagination: true,
        show_info: false,
    };

    const handleSyncVoices = async () => {
        try {
            setIsSyncing(true);
            await getAllVoices({ sync: true });
            CustomToastHandler({ msg: "Voices synced successfully" });
        } catch (err) {
            console.log("handleSyncVoices__err", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const submitSelectedVoices = async () => {
        try {
            const { status, loading, error, message } = await UpdateSelectedVoices({ selectedVoiceIds: selectedVoiceIds });
            setIsEdit(false);
            if (status) {
                CustomToastHandler({ msg: message });
                setErrors({});
            } else {
                if (error) {
                    setErrors(error);
                } else if (message) {
                    CustomToastHandler({ msg: message, type: "error" });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
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
                        <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                            <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                                <div className="d-flex justify-content-between align-items-center mt-4 px-4">
                                    <div>
                                        {isEdit && (
                                            <button
                                                className="exchange_tableFileUploader table_extrabtns"
                                                onClick={submitSelectedVoices}
                                            >
                                                <p className="cmn_extraBtnsLabel m-0">Submit</p>
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        className="orange_small_primary"
                                        onClick={handleSyncVoices}
                                        disabled={isSyncing}
                                    >
                                        {isSyncing ? "Syncing..." : count === 0 ? "Upload Voices" : "Sync Voices"}
                                    </button>
                                </div>
                                <ReactDatatable
                                    config={config}
                                    records={voiceList}
                                    columns={columns}
                                    dynamic={true}
                                    total_record={count}
                                    onChange={(e) => { handlePagination(e); }}
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