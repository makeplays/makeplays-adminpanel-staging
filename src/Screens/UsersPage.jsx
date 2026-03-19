import React, { useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import { getUser } from "../api/adminApi";
import Exportexcel from "../Components/Excelexport";
import Papa from "papaparse";
// import { addNewUserCSV } from "../actions/admin";
import { FaEye } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { UserPageModels } from "../Modals/UserPageModels";
import { RiImportFill } from "react-icons/ri";

const UsersPage = () => {

  const [userList, setUserList] = useState();
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
      key: "",
      text: "S.No",
      align: "center",
      sortable: true,
      cell: (record, index) => <p className="text-center">{index + 1}</p>,
    },
    {
      key: "name",
      text: "Firstname",
      className: "name",
      align: "center",
      sortable: false,
      cell: (record, index) => (
        <p className="text-center">{record?.firstname ? record.firstname : "--"}</p>
      ),
    },
    {
      key: "name",
      text: "Lastname",
      className: "name",
      align: "center",
      sortable: false,
      cell: (record, index) => (
        <p className="text-center">{record?.lastname ? record.lastname : "--"}</p>
      ),
    },
    {
      key: "email",
      text: "Email",
      className: "cointType",
      align: "center",
      sortable: false,
      cell: (record, index) => (
        <p className="text-center">{record?.email ? record.email : "--"}</p>
      ),
    },
    {
      key: "action",
      text: "Action",
      className: "activity",
      align: "center",
      sortable: false,
      cell: (record) => {
        return (
          <div className="d-flex justify-content-center align-items-center gap-2">
            <button
              className="table_extrabtns p-2"
              onClick={() => handleShowEditUser(record)}>
              <FaEye size={14} />
            </button>
          </div>
        );
      },
    }
  ]

  useEffect(() => {
    listUserdata();
  }, []);

  const listUserdata = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await getUser(reqData);
      if (status) {
        setUserList(result);
        setCount(count)
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("listUserdata__err", err);
    }
  };

  const handlePagination = async (index) => {
    const reqData = {
      page: index.page_number,
      limit: index.page_size,
      search: index.filter_value,
    };
    listUserdata(reqData);
    setPageNumer(index.page_number);
    setLimit(index.page_size);
  };

  const [showAddUsers, setShowAddUsers] = useState(false);
  const handleShowAddUsers = () => setShowAddUsers(true);
  const handleCloseAddUsers = () => setShowAddUsers(false);

  // edid Exchange modal
  const [showEditUser, setShowEditUser] = useState(false);
  const [editRecord, setEditRecord] = useState();
  const [deleteRecord, setDeleteRecord] = useState({});

  const handleShowEditUser = (record) => {
    setEditRecord(record);
    setShowEditUser(true);
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

  return (
    <>
      <Container fluid className="common_bg position-relative">
        <div className="liner"></div>
        <Row>
          <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
            <Sidebar />
          </Col>
          <Col xl={10} lg={12}>
            <Header title={"Users"} />

            <div className="rp_singleinput_holder mb-3">
            </div>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <div className="d-flex justify-content-between align-items-center px-3 my-3">
                  {/* <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={userList} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>

                  </div> */}
                  {/* <div className="d-flex justif-content-end align-items-center gap-2">
                    <button className="exchange_tableFileUploader table_extrabtns position-relative">
                      <RiImportFill size={20} />
                      <input
                        type="file"
                        onChange={(e) => {
                          changeHandler(e);
                        }}
                        id="importFile"
                      />
                      <label htmlFor="importFile" className="m-0 cmn_extraBtnsLabel">Import</label>
                    </button>
                    <span>{fileName}</span>
                  </div> */}
                </div>
                <ReactDatatable
                  config={config}
                  records={userList}
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

      <UserPageModels.ViewModal
        show={showEditUser}
        editData={editRecord}
        handleClose={handleCloseEditUser} />

      <UserPageModels.DeleteModal show={showDeleteUsers}
        record={deleteRecord}
        handleClose={handleCloseDeleteUsers} />

      {/* end of modals */}
    </>
  );
};

export default UsersPage;
