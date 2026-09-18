import React, { useEffect, useState, useMemo } from "react";
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
import { assetUrl } from "../../lib/assetUrl";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSelector } from "react-redux";
import { useSport } from "../../context/sportContext";

const AllTeamPage = () => {
  const { sportId } = useSport();

  const [teamList, setTeamList] = useState();
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1)
  const history = useHistory();
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState();
  const [fileValues, setFileValues] = useState();
  
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
    // The Sport column is gone: every row on this page already belongs to the
    // sport chosen in the sidebar, so it repeated the same value 121 times and
    // cost a column's width to say nothing.
    {
      key: "teamName",
      text: "Team Name",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.teamName ? record?.teamName : "--"}</p>
      },
    },
    {
      // "Division" is what the mobile Create a New Team form calls this field;
      // it is the same age_criteria column underneath. The admin was the only
      // place still calling it Age Criteria.
      key: "ageCriteria",
      text: "Division",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.ageCriteria ? record?.ageCriteria : "--"}</p>
      }
    },
    {
      // Mobile captures one free-text location through the location picker and
      // never writes country or state — those two columns exist on the table
      // but are empty for all 121 production teams, so the admin showed two
      // columns of "--" and omitted the value that is actually set on 94 of
      // them. Matching the mobile form: one Location.
      key: "location",
      text: "Location",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.location ? record?.location : "--"}</p>
      }
    },
    {
      // Mobile's placeholder reads "League, Club or Association Name"; the
      // stored column is league_or_club_name. "League / Club" keeps the header
      // honest without spilling the column.
      key: "leagueOrClubName",
      text: "League / Club",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.leagueOrClubName ? record?.leagueOrClubName : "--"}</p>
      }
    },
    {
      key: "Team Logo",
      text: "Team Logo",
      className: "activity",
      align: "center",
      sortable: false,
      cell: (record) => {
        // Only 4 of 121 teams have a logo, so the empty case is the common one
        // and it has to sit at the same height as the image card — otherwise
        // rows step up and down the table. Same placeholder the FAQ media
        // columns use. The old `!= undefined` guard also rendered nothing at
        // all when teamLogo was undefined, leaving a blank cell rather than a
        // placeholder.
        if (record?.teamLogo) {
          return (
            <div className="tableImgViewCard">
              <img src={assetUrl(record.teamLogo, `${key.IMAGE_URL}/Team/`)} alt="team logo" />
            </div>
          );
        }
        return (
          <div className="tableImgViewCard table_media_placeholder">
            <span>No Image</span>
          </div>
        );
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
            onClick={() => handleShowEditUser(record)}
          >
            <img
              src={require("../../assets/images/editer.svg").default}
              className="img-fluid table_activity_img"
            />
          </button>

          <button
            className="cmn_plain_btn"
            onClick={() => handleShowDeleteUsers(record._id)}
          >
            <img
              src={require("../../assets/images/trash.svg").default}
              className="img-fluid table_activity_img"
            />
          </button>
        </div>
      );
    },
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
    if (!sportId) return;
    getAllTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportId]);

  const getAllTeam = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await listAllTeam({ ...reqData, sportId });
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
    console.log("indexindex",index);
    
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

  // Server-side here, unlike FAQ: listAllTeam really does honour page, limit
  // and search, so dynamic={true} on the table below is correct and the length
  // menu drives a real query rather than re-slicing a page that is already
  // ten rows long.
  //
  // filename and no_data_text were still "Emailtemplates" / "No Email
  // Templates found!" from whichever page this was copied from — an empty
  // Teams list told the admin there were no email templates.
  const config = {
    page_size: 10,
    length_menu: [10, 50, 100, 200],
    filename: "Teams",
    no_data_text: "No teams found!",
    language: {
      length_menu: "Show _MENU_ result per page",
      filter: "Filter by Team Name...",
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
    show_info: true,
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
                {/* <div className="d-flex justify-content-between align-items-center px-3 my-3">
                  <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={teamList} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>
                  </div>
                </div> */}
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

export default AllTeamPage;