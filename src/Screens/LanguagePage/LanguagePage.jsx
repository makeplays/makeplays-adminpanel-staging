import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Papa from "papaparse";
import { useHistory } from "react-router-dom";
import { MembersPageModels } from "../../Modals/MembersPageModels";
import { AiFillAudio } from "react-icons/ai";
import { listAllLanguages } from '../../api/adminApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";

const LanguagePage = () => {

    const [languageList, setLanguageList] = useState();
    const [pageNumer, setPageNumer] = useState(1);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(0);
    const history = useHistory();
    const [fileName, setFileName] = useState();
    const [fileValues, setFileValues] = useState();
    const [showAudioModal, setShowAudioModal] = useState(false);
    const [selectedAudioRecord, setSelectedAudioRecord] = useState(null);

    const columns = [
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
            key: "modelId",
            text: "Model ID",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">{record?.model_id ? record.model_id : "--"}</p>
            ),
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
            key: "languages",
            text: "Languages",
            sortable: true,
            cell: (record, index) => (
                <p className="text-center">
                    {Array.isArray(record.languages)
                        ? record.languages.map(l => l.name).join(", ")
                        : ""}
                </p>
            )
        }
    ]

    useEffect(() => {
        getAllLanguages();
    }, []);

    const getAllLanguages = async (reqData) => {
        try {
            let { status, loading, error, message, result, count } = await listAllLanguages(reqData);
            if (status) {
                console.log("status",status);
                setLanguageList(result);
                setCount(count)
            } else {
                if (error) {
                } else if (message) {
                }
            }
        } catch (err) {
            console.log("getAllLanguages__err", err);
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

        getAllLanguages(reqData)
        setPageNumer(index.page_number);
        setLimit(index.page_size);
        setCount(count);
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
            filter: "Filter by Languages...",
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
                                {/* <div className="d-flex justify-content-between align-items-center px-3 my-3">
                                        <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                                            <Exportexcel excelData={userLits} fileName={"users"} />
                                            <p className="m-0 cmn_extraBtnsLabel">Exports</p>
                                        </div>
                                        </div> */}

                                <ReactDatatable
                                    config={config}
                                    records={languageList}
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
            <MembersPageModels.PreviewModal
                show={showPreview}
                handleClose={handleCloseAddUsers}
                record={selectedAudioRecord}
            />

            {/* <MembersPageModels.DeleteModal show={showDeleteUsers}
                record={deleteRecord}
                getAllLanguages={getAllLanguages}
                handleClose={handleCloseDeleteUsers}
                // onConfirm={handleConfirmDelete}
            /> */}

            {/* end of modals */}
        </>
    );
};

export default LanguagePage;
