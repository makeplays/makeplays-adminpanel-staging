import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Exportexcel from "../../Components/Excelexport";
import Papa from "papaparse";
import { useHistory } from "react-router-dom";
import { AllTeamModels } from "../../Modals/AllTeamPageModels";
import { listSubAdmin, ActivateSubadmin } from '../../api/adminApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { IoIosAdd } from "react-icons/io";
import { useSelector } from "react-redux";

const UsersAndAccessPage = () => {
  const [adminList, setAdminList] = useState();
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const history = useHistory();
  const [errors, setErrors] = useState({});
  let user = useSelector((state) => state.isRun);
  const AccessEnum = {
    "View Only": "Restricted Access Admin",
    "Admin": "Full Access Admin"
  }
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
      key: "Name",
      text: "Name",
      sortable: false,
      cell: (record) => {
        return <p className="">{record?.name ? record?.name : "--"}</p>
      },
    },
    {
      key: "Email",
      text: "Email",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.email ? record?.email : "--"}</p>
      },
    },
    {
      key: "accessLevel",
      text: "Admin Type",
      sortable: true,
      cell: (record) => {
        return <p className="">{record?.accessLevel ? AccessEnum[`${record?.accessLevel}`] : "--"}</p>
      }
    },
    {
      key: "restrictions",
      text: "Access",
      sortable: true,
      cell: (record) => {
        return record.accessLevel && record.accessLevel !== "Admin" ? (
          <div>{record.restrictions}</div>
        ) : (
          <div>--</div>
        );
      }
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
            />{" "}
          </button>

          <button
            className="table_extrabtns activeBtn text-white"
            onClick={() => {
              onactivate(record._id);
            }}>
            {record.activate == true ? "Active" : "DeActive"}

          </button>
        </div>
      );
    }
  };


  // 3. Final columns (conditionally add "Action" if Admin)
  const columns = useMemo(() => {
    let cols = [...baseColumns];
    if (user?.accessLevel === "Admin" && user?.role !== "subadmin") {
      cols.push(actionColumn);
    }
    return cols;
  }, [user]);


  useEffect(() => {
    getAllSubadmin();
  }, []);

  const getAllSubadmin = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await listSubAdmin(reqData);
      if (status) {
        setAdminList(result);
        setCount(count)
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("getAllSubadmin__err", err);
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
    getAllSubadmin(reqData)
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
    history.push('/admin-and-access/edit', { record: record });
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
    show_filter: false,
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

  const onactivate = async (data) => {
    try {
      const { status, message, error } = await ActivateSubadmin({ id: data });
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({});
        getAllSubadmin();
      } else {
        if (error) {
          setErrors(error);
        } else if (message) {
          CustomToastHandler({ msg: message, type: "error" })
        }
      }
    } catch (err) {
      console.log("onactivate__err", err);
    }
  };

  const handleAddUsers = () => {
    history.push("/admin-and-access/add")
  }

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
              <div className="d-flex justify-content-end align-items-center gap-2 pe-1">
                {user?.accessLevel && user?.accessLevel === "Admin" && user?.role === 'superadmin' ?
                  <button className="exchange_tableFileUploader table_extrabtns" onClick={handleAddUsers}>
                    <IoIosAdd size={25} />
                    <p className="cmn_extraBtnsLabel m-0">
                      Add
                    </p>
                  </button>
                  : <></>}
              </div>
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                {/* <div className="d-flex justify-content-between align-items-center px-3 my-3">
                  <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={teamList} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>
                  </div>
                </div> */}
                <ReactDatatable
                  config={config}
                  records={adminList}
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
      {/* <AllTeamModels.DeleteModal show={showDeleteUsers}
        record={deleteRecord}
        getAllSubadmin={getAllSubadmin}
        handleClose={handleCloseDeleteUsers}
        onConfirm={handleConfirmDelete}
      /> */}

      {/* end of modals */}
    </>
  );
};

export default UsersAndAccessPage;