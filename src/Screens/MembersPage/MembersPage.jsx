import React, { useEffect, useRef, useState, useMemo } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
// import { getUserList } from "../actions/admin";
import Exportexcel from "../../Components/Excelexport";
import Papa from "papaparse";
// import { addNewUserCSV } from "../actions/admin";
import { FaEye } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { UserPageModels } from "../../Modals/UserPageModels";
import { RiImportFill } from "react-icons/ri";
import { MembersPageModels } from "../../Modals/MembersPageModels";
import { Images } from "../../Images";
import { AiFillAudio } from "react-icons/ai";
import { listAllMember, DeleteMember, getAllTeams } from '../../api/memberApi'
import { listAllTeams } from '../../api/teamApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSelector } from "react-redux";

const MembersPage = () => {
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const history = useHistory();
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState();
  const [fileValues, setFileValues] = useState();
  const [memberList, setMemberList] = useState();
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [selectedAudioRecord, setSelectedAudioRecord] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
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
      key: "teamname",
      text: "Team Name",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.teamId?.teamName ? record?.teamId?.teamName : "--"}</p>
      ),
    },
    {
      key: "firstname",
      text: "Firstname",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.firstname ? record.firstname : "--"}</p>
      ),
    },
    {
      key: "lastname",
      text: "Lastname",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.lastname ? record.lastname : "--"}</p>
      ),
    },
    {
      key: "email",
      text: "Email",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.email ? record.email : "--"}</p>
      ),
    },
    {
      key: "position",
      text: "Position",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.position ? record.position : "--"}</p>
      ),
    },
    {
      key: "phonenumber",
      text: "P.No",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.phonenumber ? record.phonenumber : "--"}</p>
      ),
    },
    {
      key: "number",
      text: "Number",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.number ? record.number : "--"}</p>
      ),
    },
    {
      key: "address",
      text: "Address",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.address ? record.address : "--"}</p>
      ),
    },
    {
      key: "city",
      text: "City",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.city ? record.city : "--"}</p>
      ),
    },
    {
      key: "country",
      text: "Country",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.country ? record.country : "--"}</p>
      ),
    },
    {
      key: "province",
      text: "Province",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.province ? record.province : "--"}</p>
      ),
    },
    {
      key: "postalcode",
      text: "Postal Code",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.postalcode ? record.postalcode : "--"}</p>
      ),
    },
    {
      key: "private",
      text: "Private",
      sortable: true,
      cell: (record) => {
        if (Array.isArray(record.private) && record.private.length > 0) {
          return record.private.join(", ");
        }
        return "-"; // fallback if empty or not an array
      },
    },
    {
      key: "Image",
      text: "Image",
      className: "activity",
      align: "center",
      sortable: false,
      cell: (record) => {
        if (record?.memberImage && record.memberImage !== "undefined") {
          return (
            <div className="tableImgViewCard">
              <img
                src={`${key.IMAGE_URL}/Member/${record.memberImage}`}
                alt="Member"
              />
            </div>
          );
        } else {
          return <span>--</span>;
        }
      },
    },
    {
      key: "Audio",
      text: "AiVoice",
      className: "activity",
      align: "center",
      sortable: false,
      cell: (record) => {
        if (record?.aiVoice && record.aiVoice !== "undefined") {
          return (
            <div className="d-flex justify-content-center align-items-center gap-2 w-100">
              <button className="table_extrabtns p-2" onClick={() => audioPreviewHandle(record)}>
                <AiFillAudio fontSize={20} />
              </button>
            </div>
          );
        } else {
          return <span>--</span>;
        }
      },
    }
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
          <button
            className="cmn_plain_btn"
            onClick={() => {
              handleShowEditUser(record);
            }}>
            <img
              src={require("../../assets/images/editer.svg").default}
              className="img-fluid table_activity_img"
            />
          </button>

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
    //   cols.push(actionColumn);
    // }
    return cols;
  }, [user]);

  useEffect(() => {
    getAllMember();
    listTeam()
  }, []);

  const listTeam = async () => {
    try {
      let { status, loading, result } = await listAllTeams();
      if (status) {
        setTeams(result || []);
      }
    } catch (err) {
      console.log("listTeam__err", err);
    }
  };

  const getAllMember = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await listAllMember(reqData);
      if (status) {
        setMemberList(result);
        setCount(count)
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("getAllMember__err", err);
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
      teamId:selectedTeam
    };
    getAllMember(reqData)
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
      filter: "Filter by Firstname...",
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

  const handleTeamChange = (teamId) => {
    setSelectedTeam(teamId);

    // if team selected → pass teamId
    if (teamId) {
      getAllMember({ teamId });
    } else {
      // placeholder selected → fetch all members
      getAllMember({});
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const data = { memberId: deleteRecord };
      const { status, message, error } = await DeleteMember(data);
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({});
        getAllMember();
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
                {/* <div className="d-flex justify-content-between align-items-center px-3 my-3">
                  <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={userLits} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>
                  </div>
                </div> */}

                <Form.Group className="m-3 custom-dropdown">
                  <Form.Label className="text-white">Teams</Form.Label>

                  <Form.Select
                    aria-label="Select Game Control value"
                    className="custom-select-dropdown"
                    value={selectedTeam}
                    onChange={(e) => handleTeamChange(e.target.value)}
                  >
                    <option value="" disabled hidden>
                      Select Team
                    </option>
                 

                    {teams.map((team) => (
                      <option key={team?._id} value={team?._id}>
                        {team?.teamName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <ReactDatatable
                  config={config}
                  records={memberList}
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

      <MembersPageModels.DeleteModal show={showDeleteUsers}
        record={deleteRecord}
        getAllMember={getAllMember}
        handleClose={handleCloseDeleteUsers}
        onConfirm={handleConfirmDelete}
      />

      {/* end of modals */}
    </>
  );
};

export default MembersPage;
