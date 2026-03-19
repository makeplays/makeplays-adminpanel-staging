import React, { useEffect, useRef, useState, useMemo } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Exportexcel from "../../Components/Excelexport";
import Papa from "papaparse";
import { FaEye } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { RiImportFill } from "react-icons/ri";
import { EventPageModels } from "../../Modals/EventPageModels";
import { IoIosAdd } from "react-icons/io";
import { listAllEvent, DeleteEvent } from '../../api/eventApi'
import { listAllTeams } from '../../api/teamApi'
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSelector } from "react-redux";

const EventsPage = () => {

  const [eventList, setEventList] = useState();
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const history = useHistory();
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState();
  const [fileValues, setFileValues] = useState();
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
      key: "teamName",
      text: "Team Name",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.teamId?.teamName ? record?.teamId?.teamName : "--"}</p>
      }
    },
    {
      key: "eventType",
      text: "Event Type",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.eventType ? record.eventType : "--"}</p>
      ),
    },
    {
      key: "maxPlayers",
      text: "Max Players",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.maxPlayers ? record?.maxPlayers : "--"}</p>
      }
    },
    {
      key: "date",
      text: "Date",
      sortable: true,
      cell: (record, index) => {
        if (!record?.date) return <p className="text-center">--</p>;

        const dateObj = new Date(record.date);

        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();

        return (
          <p className="text-center">
            {`${day}-${month}-${year}`}
          </p>
        );
      },
    },
    {
      key: "duration",
      text: "Duration",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.duration ? record.duration : "--"}</p>
      ),
    },
    {
      key: "location",
      text: "Location",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.location ? record.location : "--"}</p>
      ),
    },
    {
      key: "homeOrAway",
      text: "Home/Away",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.homeOrAway ? record.homeOrAway : "--"}</p>
      ),
    },
    {
      key: "opponent",
      text: "Opponent Team",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.opponent?.teamName ? record?.opponent?.teamName : "--"}</p>
      }
    },
    {
      key: "time",
      text: "Time",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.time ? record.time : "--"}</p>
      ),
    },
    {
      key: "arrive",
      text: "Arrive",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.name ? record.name : "--"}</p>
      ),
    },
    {
      key: "uniform",
      text: "Uniform",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.uniform ? record.uniform : "--"}</p>
      ),
    },
    {
      key: "notes",
      text: "Notes",
      sortable: true,
      cell: (record, index) => (
        <p className="text-center">{record?.notes ? record.notes : "--"}</p>
      ),
    },
    // {
    //   key: "action",
    //   text: "Action",
    //   className: "activity",
    //   align: "center",
    //   sortable: false,
    //   cell: (record) => {
    //     return (
    //       <div className="d-flex justify-content-center align-items-center gap-2">
    //         <button
    //           className="cmn_plain_btn"
    //           onClick={() => {
    //             handleShowEditUser(record);
    //           }}>
    //           <img
    //             src={require("../../assets/images/editer.svg").default}
    //             className="img-fluid table_activity_img"
    //           />
    //         </button>
    //         <button
    //           className="cmn_plain_btn"
    //           onClick={() => {
    //             handleShowDelete(record._id);
    //           }}>
    //           <img
    //             src={require("../../assets/images/trash.svg").default}
    //             className="img-fluid table_activity_img"
    //           />
    //         </button>
    //       </div>
    //     );
    //   },
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
              handleShowDelete(record._id);
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
    getAllEvent();
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

  const getAllEvent = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await listAllEvent(reqData);
      if (status) {
        setEventList(result);
        setCount(count)
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("getAllEvent__err", err);
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
      teamId: selectedTeam
    };
    getAllEvent(reqData)
    setPageNumer(index.page_number);
    setLimit(index.page_size);
    setCount(count);
  };

  const handleShowAddUsers = () => {
    history.push("/events/add")
  };

  // edid Exchange modal
  const [showEditUser, setShowEditUser] = useState(false);
  const [editRecord, setEditRecord] = useState();
  const [deleteRecord, setDeleteRecord] = useState({});

  const handleShowEditUser = (record) => {
    setEditRecord(record);
    setShowEditUser(true);
    history.push("/events/edit", { record: record })
  };

  const handleCloseEditUser = () => {
    setShowEditUser(false);
    setEditRecord({});
  };

  const loginNavigateHandle = () => {
    history.push("/login-users")
  };

  // delete Exchange modal
  const [showDeleteUsers, setShowDeleteUsers] = useState(false);

  const handleShowDelete = (record) => {
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
      filter: "Filter by Event Type...",
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
      const data = { eventId: deleteRecord };
      const { status, message, error } = await DeleteEvent(data);
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({});
        getAllEvent();
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

  const handleTeamChange = (teamId) => {
    setSelectedTeam(teamId);

    // if team selected → pass teamId
    if (teamId) {
      getAllEvent({ teamId });
    } else {
      // placeholder selected → fetch all members
      getAllEvent({});
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
            <Header title={"Events"} />
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <div className="d-flex justify-content-between align-items-center px-3">
                  {/* <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={eventList} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>

                  </div> */}
                </div>
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
                  records={eventList}
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

      {/*start modals */}
      <EventPageModels.DeleteModal show={showDeleteUsers}
        record={deleteRecord}
        getAllEvent={getAllEvent}
        handleClose={handleCloseDeleteUsers}
        onConfirm={handleConfirmDelete}
      />
      {/* end of modals */}
    </>
  );
};

export default EventsPage;
