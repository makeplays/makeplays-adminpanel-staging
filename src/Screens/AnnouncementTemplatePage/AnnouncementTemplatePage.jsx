import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { IoIosAdd } from "react-icons/io";
import ReactDatatable from "@ashvin27/react-datatable";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import { SportPageModels } from "../../Modals/SportPageModels";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { getAnnouncementTemplates, deleteAnnouncementTemplate } from "../../api/adminApi";

const AnnouncementTemplatePage = () => {
  const [list, setList] = useState([]);
  const [count, setCount] = useState(0);
  const [deleteRecord, setDeleteRecord] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const history = useHistory();
  const user = useSelector((state) => state.isRun);

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
      key: "category",
      text: "Category",
      sortable: true,
      cell: (record) => (
        <p className="text-center text-capitalize">{record?.category || "--"}</p>
      ),
    },
    {
      key: "type",
      text: "Type",
      sortable: true,
      cell: (record) => (
        <p className="text-center text-capitalize">{record?.type || "--"}</p>
      ),
    },
    {
      key: "phrase",
      text: "Phrase",
      sortable: false,
      cell: (record) => (
        <p className="text-center">{record?.phrase || "--"}</p>
      ),
    },
    {
      key: "createdAt",
      text: "Created Date",
      sortable: true,
      cell: (record) => (
        <p className="text-center">
          {record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : "--"}
        </p>
      ),
    },
  ];

  const actionColumn = {
    key: "action",
    text: "Action",
    className: "activity",
    align: "center",
    sortable: false,
    cell: (record) => (
      <div className="d-flex justify-content-center align-items-center gap-2">
        <button
          className="cmn_plain_btn"
          onClick={() => history.push("/announcement-template/edit", { record })}>
          <img
            src={require("../../assets/images/editer.svg").default}
            className="img-fluid table_activity_img"
          />
        </button>
        <button
          className="cmn_plain_btn"
          onClick={() => { setDeleteRecord(record); setShowDeleteModal(true); }}>
          <img
            src={require("../../assets/images/trash.svg").default}
            className="img-fluid table_activity_img"
          />
        </button>
      </div>
    ),
  };

  const columns = useMemo(() => {
    let cols = [...baseColumns];
    if (user?.accessLevel === "Admin") cols.push(actionColumn);
    return cols;
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (reqData) => {
    try {
      const { status, result, count } = await getAnnouncementTemplates(reqData);
      if (status) {
        setList(result);
        setCount(count);
      }
    } catch (err) {
      console.log("fetchTemplates__err", err);
    }
  };

  const handlePagination = (index) => {
    fetchTemplates({ page: index.page_number, limit: index.page_size, search: index.filter_value });
  };

  const handleConfirmDelete = async () => {
    try {
      const { status, message } = await deleteAnnouncementTemplate({ id: deleteRecord._id });
      if (status) {
        CustomToastHandler({ msg: message });
        fetchTemplates();
      } else {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("handleConfirmDelete__err", err);
      CustomToastHandler({ msg: "Failed to delete template", type: "error" });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const config = {
    page_size: 10,
    length_menu: [10, 20, 50],
    filename: "AnnouncementTemplates",
    no_data_text: "No Announcement Templates found!",
    language: {
      length_menu: "Show _MENU_ result per page",
      filter: "Filter by Phrase...",
      info: "Showing _START_ to _END_ of _TOTAL_ records",
      pagination: { first: "First", previous: "Previous", next: "Next", last: "Last" },
    },
    show_length_menu: false,
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
            <Header title={"Announcement Templates"} />
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <div className="d-flex justify-content-end align-items-center px-3 my-3">
                  {user?.accessLevel === "Admin" && (
                    <button
                      className="exchange_tableFileUploader table_extrabtns"
                      onClick={() => history.push("/announcement-template/add")}>
                      <IoIosAdd size={25} />
                      <p className="cmn_extraBtnsLabel m-0">Add Template</p>
                    </button>
                  )}
                </div>
                <ReactDatatable
                  config={config}
                  records={list}
                  columns={columns}
                  dynamic={true}
                  total_record={count}
                  onChange={handlePagination}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <SportPageModels.DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AnnouncementTemplatePage;