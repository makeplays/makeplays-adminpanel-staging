import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Exportexcel from "../../Components/Excelexport";
import Papa from "papaparse";
import { useHistory } from "react-router-dom";
import { AllTeamModels } from "../../Modals/AllTeamPageModels";
import { listAllTeam, DeleteTeam } from '../../api/teamApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";

const Attendancepage = () => {

  const [teamList, setTeamList] = useState();
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1)
  const history = useHistory();
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState();
  const [fileValues, setFileValues] = useState();

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
      key: "sport",
      text: "Sport",
      sortable: false,
      cell: (record) => {
        return <p className="">{record?.sportId?.name ? record?.sportId?.name : "--"}</p>
      },
    },
    {
      key: "teamName",
      text: "Team Name",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.teamName ? record?.teamName : "--"}</p>
      },
    },
    {
      key: "ageCriteria",
      text: "Age Criteria",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.ageCriteria ? record?.ageCriteria : "--"}</p>
      }
    },
    {
      key: "leagueOrClubName",
      text: "League Name",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.leagueOrClubName ? record?.leagueOrClubName : "--"}</p>
      }
    },
    {
      key: "country",
      text: "Country",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.country ? record?.country : "--"}</p>
      }
    },
    {
      key: "city",
      text: "City",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.city ? record?.city : "--"}</p>
      }
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

    //         {/* <button
    //           className="cmn_plain_btn"
    //           onClick={() => {
    //             handleShowEditUser(record);
    //           }}>
    //           <img
    //             src={require("../../assets/images/editer.svg").default}
    //             className="img-fluid table_activity_img"
    //           />{" "}
    //         </button> */}

    //         <button
    //           className="cmn_plain_btn"
    //           onClick={() => {
    //             handleShowDeleteUsers(record._id);
    //           }}>
    //           <img
    //             src={require("../../assets/images/trash.svg").default}
    //             className="img-fluid table_activity_img"
    //           />{" "}
    //         </button>
    //       </div>
    //     );
    //   },
    // },
  ]

  useEffect(() => {
    getAllTeam();
  }, []);

  const getAllTeam = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await listAllTeam(reqData);
      if (status) {
        setTeamList(result);
        setCount(count)
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("getAllTeam__err", err);
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
    getAllTeam(reqData)
    setPageNumer(index.page_number);
    setLimit(index.page_size);
    setCount(count);
  };

  // add modal
  const [showAddUsers, setShowAddUsers] = useState(false);
  const handleShowAddUsers = () => setShowAddUsers(true);
  const handleCloseAddUsers = () => setShowAddUsers(false);

  // edit Exchange modal
  const [showEditUser, setShowEditUser] = useState(false);
  const [editRecord, setEditRecord] = useState();
  const [deleteRecord, setDeleteRecord] = useState({});

  const handleShowEditUser = (record) => {
    setEditRecord(record);
    setShowEditUser(true);
    history.push('/teams/edit', { record: record });
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
      filter: "Filter in records...",
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
      const data = { teamId: deleteRecord };
      const { status, message, error } = await DeleteTeam(data);
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({});
        getAllTeam();
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
            <Header title={"Team"} />
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <ReactDatatable
                  config={config}
                  records={teamList}
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
      <AllTeamModels.DeleteModal show={showDeleteUsers}
        record={deleteRecord}
        getAllTeam={getAllTeam}
        handleClose={handleCloseDeleteUsers}
        onConfirm={handleConfirmDelete}
      />

      {/* end of modals */}
    </>
  );
};

export default Attendancepage;