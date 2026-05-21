import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import { useHistory } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import { SportPageModels } from "../../Modals/SportPageModels";
import { listAllSports, DeleteSports, ActivateSports } from '../../api/sportApi';
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSelector } from "react-redux";

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

const SportPage = () => {
  const [sportsList, setSportsList] = useState();
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const history = useHistory();
  const [errors, setErrors] = useState({});

  let user = useSelector((state) => state.isRun);

  const baseColumns = [
    {
      key: "sno",
      text: "S.No",
      className: "w_100 text-center",
      align: "center",
      sortable: false,
      cell: (record, index) => <p className="">{index + 1}</p>,
    },
    {
      key: "name",
      text: "Name",
      sortable: true,
      cell: (record) => (
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
      key: "sport_logo",
      text: "Logo",
      sortable: false,
      cell: (record) => {
        if (record?.image && record.image !== "undefined") {
          return (
            <div className="tableImgViewCard">
              <img src={`${key.IMAGE_URL}/Sports/${record.image}`} alt="sport logo" />
            </div>
          );
        }
        return <p className="text-center">--</p>;
      },
    },
  ];

  const actionColumn = {
    key: "action",
    text: "Action",
    className: "activity",
    align: "center",
    sortable: false,
    cell: (record) => (
      <div className="d-flex justify-content-center align-items-center gap-1">
        <button
          className="cmn_plain_btn"
          onClick={() => handleShowEditUser(record)}
        >
          <img
            src={require("../../assets/images/editer.svg").default}
            className="img-fluid table_activity_img"
            alt="edit"
          />
        </button>
        <button
          className="cmn_plain_btn"
          onClick={() => handleShowDeleteUsers(record)}
        >
          <img
            src={require("../../assets/images/trash.svg").default}
            className="img-fluid table_activity_img"
            alt="delete"
          />
        </button>
        <button
          onClick={() => onactivate(record._id)}
          title={!record.activate ? "Click to deactivate" : "Click to activate"}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: !record.activate ? 'rgba(76,175,80,0.12)' : 'rgba(158,158,158,0.12)',
            color: !record.activate ? '#4CAF50' : '#9E9E9E',
            border: `1px solid ${!record.activate ? '#4CAF50' : '#9E9E9E'}`,
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: !record.activate ? '#4CAF50' : '#9E9E9E',
              flexShrink: 0,
            }} />
            {!record.activate ? 'Active' : 'Inactive'}
          </span>
        </button>
      </div>
    ),
  };

  const columns = useMemo(() => {
    let cols = [...baseColumns];
    if (user?.accessLevel === "Admin") {
      cols.push(actionColumn);
    }
    return cols;
  }, [user]);

  useEffect(() => {
    getAllSports();
  }, []);

  const getAllSports = async (reqData) => {
    try {
      const { status, error, message, result, count } = await listAllSports(reqData);
      if (status) {
        setSportsList(result);
        setCount(count);
      } else {
        if (message) CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("getAllSports__err", err);
    }
  };

  const handlePagination = async (index) => {
    const reqData = {
      page: index.page_number,
      limit: index.page_size,
      search: index.filter_value,
    };
    getAllSports(reqData);
    setPageNumer(index.page_number);
    setLimit(index.page_size);
  };

  const onactivate = async (id) => {
    try {
      const { status, message, error } = await ActivateSports({ id });
      if (status) {
        CustomToastHandler({ msg: message });
        setErrors({});
        getAllSports();
      } else {
        if (error) setErrors(error);
        else if (message) CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("onactivate__err", err);
    }
  };

  const handleShowAddUsers = () => history.push("/sports/add");

  const [showEditUser, setShowEditUser] = useState(false);
  const [editRecord, setEditRecord] = useState();
  const [deleteRecord, setDeleteRecord] = useState({});

  const handleShowEditUser = (record) => {
    setEditRecord(record);
    setShowEditUser(true);
    history.push("/sports/edit", { record });
  };

  const handleCloseEditUser = () => {
    setShowEditUser(false);
    setEditRecord({});
  };

  const [showDeleteUsers, setShowDeleteUsers] = useState(false);
  const handleShowDeleteUsers = (record) => {
    setDeleteRecord(record);
    setShowDeleteUsers(true);
  };
  const handleCloseDeleteUsers = () => setShowDeleteUsers(false);

  const handleConfirmDelete = async () => {
    try {
      const { status, message, error } = await DeleteSports({ sportsId: deleteRecord });
      if (status) {
        CustomToastHandler({ msg: message });
        setErrors({});
        getAllSports();
      } else {
        if (error) setErrors(error);
        else if (message) CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("handleConfirmDelete__error", err);
      CustomToastHandler({ msg: "An error occurred while deleting the record.", type: "error" });
    } finally {
      handleCloseDeleteUsers();
    }
  };

  const config = {
    page_size: 10,
    length_menu: [10, 50, 100, 200],
    filename: "Sports",
    no_data_text: "No Sports found!",
    language: {
      length_menu: "Show _MENU_ result per page",
      filter: "Filter in sports...",
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

  return (
    <>
      <Container fluid className="common_bg position-relative">
        <div className="liner"></div>
        <Row>
          <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
            <Sidebar />
          </Col>
          <Col xl={10} lg={12}>
            <Header title={"Sports"} />
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <div className="d-flex justify-content-end align-items-center px-3 my-3">
                  {user?.accessLevel === "Admin" && (
                    <button
                      className="exchange_tableFileUploader table_extrabtns"
                      onClick={handleShowAddUsers}
                    >
                      <IoIosAdd size={25} />
                      <p className="cmn_extraBtnsLabel m-0">Add Sport</p>
                    </button>
                  )}
                </div>

                <ReactDatatable
                  config={config}
                  records={sportsList}
                  columns={columns}
                  dynamic={true}
                  total_record={count}
                  onChange={(e) => handlePagination(e)}
                  filterRecords={(e) => {}}
                  filterData={(e) => {}}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <SportPageModels.DeleteModal
        show={showDeleteUsers}
        record={deleteRecord}
        getAllSports={getAllSports}
        handleClose={handleCloseDeleteUsers}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default SportPage;