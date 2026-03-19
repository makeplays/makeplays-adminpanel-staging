import React, { useEffect, useRef, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Papa from "papaparse";
import { useHistory } from "react-router-dom";
import { AiFillAudio } from "react-icons/ai";
import { listAllPlaylist, DeletePlaylist } from '../../api/adminApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { ListPlaylistModels } from "../../Modals/ListPlaylistPageModels";
import { useSelector } from "react-redux";

const PlaylistPage = () => {

    const [playList, setPlayList] = useState();
    const [pageNumer, setPageNumer] = useState(1);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(0);
    const history = useHistory();
    const [errors, setErrors] = useState({});
    const [fileName, setFileName] = useState();
    const [fileValues, setFileValues] = useState();
    const [showAudioModal, setShowAudioModal] = useState(false);
    const [selectedAudioRecord, setSelectedAudioRecord] = useState(null);
    let user = useSelector((state) => state.isRun);

    const baseColumns = [
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
            key: "teamName",
            text: "Team Name",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.teamId?.teamName ? record?.teamId?.teamName : "--"}</p>
            ),
        },
        {
            key: "audioName",
            text: "Audio Name",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.audioName ? record?.audioName : "--"}</p>
            ),
        },
        {
            key: "Audio",
            text: "Audio",
            className: "activity",
            align: "center",
            sortable: false,
            cell: (record) => {
                if (record?.audio && record.audio !== "undefined") {
                    return (
                        <div className="d-flex justify-content-center align-items-center gap-2 w-100">
                            <button className="table_extrabtns p-2" onClick={() => audioPreviewHandle(record)}>
                                <AiFillAudio fontSize={20} />
                            </button>
                        </div>
                    );
                } else {
                    return <span>--</span>
                }
            },
        },
        // {
        //     key: "action",
        //     text: "Action",
        //     className: "activity",
        //     align: "center",
        //     sortable: false,
        //     cell: (record) => {
        //         return (
        //             <div className="d-flex justify-content-center align-items-center gap-2">
        //                 {/* <button
        //                     className="cmn_plain_btn"
        //                     onClick={() => {
        //                         handleShowEditUser(record);
        //                     }}>
        //                     <img
        //                         src={require("../../assets/images/editer.svg").default}
        //                         className="img-fluid table_activity_img"
        //                     />
        //                 </button> */}
        //                 <button
        //                     className="cmn_plain_btn"
        //                     onClick={() => {
        //                         handleShowDeleteUsers(record._id);
        //                     }}>
        //                     <img
        //                         src={require("../../assets/images/trash.svg").default}
        //                         className="img-fluid table_activity_img"
        //                     />
        //                 </button>
        //             </div>
        //         );
        //     },
        // }
    ]

    // 2. Action column separately
    const actionColumn = {
        key: "action",
        text: "Action",
        className: "activity",
        align: "center",
        sortable: false,
        cell: (record) => {
            return (
                <div className="d-flex justify-content-center align-items-center gap-2">
                    {/* <button
                            className="cmn_plain_btn"
                            onClick={() => {
                                handleShowEditUser(record);
                            }}>
                            <img
                                src={require("../../assets/images/editer.svg").default}
                                className="img-fluid table_activity_img"
                            />
                        </button> */}
                    <button
                        className="cmn_plain_btn"
                        onClick={() => {
                            handleShowDeleteUsers(record._id);
                        }}>
                        <img
                            src={require("../../assets/images/trash.svg").default}
                            className="img-fluid table_activity_img"
                        />
                    </button>
                </div>
            );
        }
    };

    // 3. Final columns (conditionally add "Action" if Admin)
    const columns = useMemo(() => {
        let cols = [...baseColumns];
        // if (user?.accessLevel === "Admin") {
        //     cols.push(actionColumn);
        // }
        return cols;
    }, [user]);

    useEffect(() => {
        getAllPlaylist();
    }, []);

    const getAllPlaylist = async (reqData) => {
        try {
            let { status, loading, error, message, result, count } = await listAllPlaylist(reqData);
            if (status) {
                setPlayList(result);
                setCount(count)
            } else {
                if (error) {
                } else if (message) {
                }
            }
        } catch (err) {
            console.log("getAllPlaylist__err", err);
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
        getAllPlaylist(reqData)
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
        history.push("/playlist/edit", { record: record })
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
            filter: "Filter by Audio Name...",
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

    const handleConfirmDelete = async () => {
        try {
            const data = { playlistId: deleteRecord };
            const { status, message, error } = await DeletePlaylist(data);
            if (status) {
                CustomToastHandler({ msg: message })
                setErrors({});
                getAllPlaylist();
            } else {
                if (error) {
                    setErrors(error);
                } else if (message) {
                    CustomToastHandler({ msg: message, type: "error" })
                }
            }
        } catch (err) {
            console.log("handleConfirmDelete__error", err);
            CustomToastHandler({ msg: "An error occurred while deleting the record.", type: "error" })
        } finally {
            handleCloseDeleteUsers();
        }
    };

    return (
        <>
            <Container fluid className="common_bg position-relative">
                <div className="liner"></div>
                <Row>
                    <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
                        <Sidebar />
                    </Col>
                    <Col xl={10} lg={12}>
                        <Header title={"Members"} />

                        <div className="rp_singleinput_holder mb-3">
                        </div>
                        <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                            <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                                <ReactDatatable
                                    config={config}
                                    records={playList}
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

            {/* modals */}
            <ListPlaylistModels.PreviewModal
                show={showPreview}
                handleClose={handleCloseAddUsers}
                record={selectedAudioRecord}
            />

            <ListPlaylistModels.DeleteModal show={showDeleteUsers}
                record={deleteRecord}
                getAllPlaylist={getAllPlaylist}
                handleClose={handleCloseDeleteUsers}
                onConfirm={handleConfirmDelete}
            />

            {/* end of modals */}
        </>
    );
};

export default PlaylistPage;
