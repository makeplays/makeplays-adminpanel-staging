import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import Exportexcel from "../../Components/Excelexport";
import Papa from "papaparse";
import { useHistory } from "react-router-dom";
import { RiImportFill } from "react-icons/ri";
import { Images } from "../../Images";
import { SportPageModels } from "../../Modals/SportPageModels";
import { IoIosAdd } from "react-icons/io";
import { listAllFaq, DeleteFaq } from '../../api/adminApi'
import key from "../../config/index";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSelector } from "react-redux";
import { FaqPageModels } from "../../Modals/FaqPageModels";

const FaqPage = () => {
  
  const [list, setList] = useState();
  const [pageNumer, setPageNumer] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
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
    {
      key: "question",
      text: "Question",
      sortable: true,
      cell: (record) => (
        <p className="text-center">{record?.question ? record.question : "--"}</p>
      ),
    },
    {
      key: "answer",
      text: "Answer",
      sortable: true,
      cell: (record) => (
        <p className="text-center">{record?.answer ? record.answer : "--"}</p>
      ),
    },
    {
      key: "image",
      text: "Image",
      sortable: false,
      cell: (record) => {
        if (record?.image && record?.image !== "undefined") {
          return (
            <div className="tableFaqImgViewCard">
              <img
                src={`${key.IMAGE_URL}/Faq/${record.image}`}
              />{" "}
            </div>
          );
        }
        else {
          return <span>No Image</span>;
        }
      },
    },
    {
      key: "video",
      text: "Video",
      sortable: false,
      width: "350px",
      cell: (record) => {
        if (record?.video && record?.video !== "undefined") {
          return (
            <div className="tableVideoViewCard">
              <video src={`${key.IMAGE_URL}/Faq/${record.video}`} controls></video>
              {" "}
            </div>
          );
        }
        else {
          return <span>No Video</span>;
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
        <div>
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
              className="cmn_plain_btn"
              onClick={() => {
                handleShowDeleteUsers(record);
              }}>
              <img
                src={require("../../assets/images/trash.svg").default}
                className="img-fluid table_activity_img"
              />{" "}
            </button>
            {/*  */}
          </div>
        </div>
      );
    }
  };

  // 3. Final columns (conditionally add "Action" if Admin)
  const columns = useMemo(() => {
    let cols = [...baseColumns];
    if (user?.accessLevel === "Admin") {
      cols.push(actionColumn);
    }
    return cols;
  }, [user]);

  useEffect(() => {
    getAllFaq();
  }, []);

  const getAllFaq = async (reqData) => {
    try {
      let { status, loading, error, message, result, count } = await listAllFaq(reqData);
      if (status) {
        setList(result);
        setCount(count)
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("getAllFaq__err", err);
    }
  };

  const address_showing = (item) => {
    if (item && item.toString().length > 10) {
      var slice_front = item.slice(0, 9);
      var slice_end = item.slice(item.length - 9, item.length + 1);
      return slice_front + "...." + slice_end;
    } else return item;
  };

  // add modal
  const [showAddUsers, setShowAddUsers] = useState(false);
  const handleShowAddUsers = () => {
    history.push("/faq/add")
  };

  // edid Exchange modal
  const [showEditUser, setShowEditUser] = useState(false);
  const [editRecord, setEditRecord] = useState();
  const [deleteRecord, setDeleteRecord] = useState({});

  const handleShowEditUser = (record) => {
    setEditRecord(record);
    setShowEditUser(true);
    history.push("/faq/edit", { record: record })
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

  const handleConfirmDelete = async () => {
    try {
      const data = { faqId: deleteRecord._id };
      const { status, message, error } = await DeleteFaq(data);
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({});
        getAllFaq();
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

  const handlePagination = async (index) => {
    let reqData = {
      page: index.page_number,
      limit: index.page_size,
      search: index.filter_value,
    };
    getAllFaq(reqData)
    setPageNumer(index.page_number);
    setLimit(index.page_size);
    setCount(count);
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

                <div className="d-flex justify-content-end align-items-center px-3 my-3">
                  {/* <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={sportsList} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>
                  </div> */}
                  <div className="d-flex justif-content-end align-items-center gap-2">
                    {user?.accessLevel && user?.accessLevel === "Admin" ?
                      <button className="exchange_tableFileUploader table_extrabtns" onClick={handleShowAddUsers}>
                        <IoIosAdd size={25} />
                        <p className="cmn_extraBtnsLabel m-0">
                          Add Faq
                        </p>
                      </button>
                      : <></>}
                  </div>
                </div>

                <ReactDatatable
                  config={config}
                  records={list}
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

      <FaqPageModels.DeleteModal show={showDeleteUsers}
        record={deleteRecord}
        getAllFaq={getAllFaq}
        handleClose={handleCloseDeleteUsers}
        onConfirm={handleConfirmDelete}
      />
      {/* end of modals */}
    </>
  );
};

export default FaqPage;
