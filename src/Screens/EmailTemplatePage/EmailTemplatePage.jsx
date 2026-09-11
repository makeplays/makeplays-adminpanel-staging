import React, { useEffect, useRef, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { getEmailTemplate } from "../../api/adminApi";
import { useSelector } from "react-redux";

const EmailTemplatePage = () => {
  let user = useSelector((state) => state.isRun);

  const baseColumns = [
    {
      // Not sortable: `index` is the row's position on the CURRENT page, so
      // sorting by it would reorder rows against a number that is itself
      // derived from the order — and the header would offer to sort by a
      // column that carries no data of its own.
      key: "sno",
      text: "S.No",
      align: "center",
      sortable: false,
      cell: (record, index) => <p className="text-center">{index + 1}</p>,
    },
    {
      // Sortable now that there is more than one page to sort across, and
      // the column the filter box searches.
      key: "subject",
      text: "Subject",
      className: "text-center",
      align: "center",
      sortable: true,
      cell: (record) => (
        <p className="text-center">{record?.subject ? record.subject : "--"}</p>
      )
    },
    {
      // The identifier is what actually distinguishes these rows — several
      // subjects are near-identical ("Register Verification Code" vs "Resend
      // Verification Code"), and callers reference templates by identifier,
      // not by subject. Worth a column now that all 18 are reachable.
      key: "identifier",
      text: "Identifier",
      className: "text-center",
      align: "center",
      sortable: true,
      cell: (record) => (
        <p className="text-center">{record?.identifier ? record.identifier : "--"}</p>
      )
    }
  ];

  // 2. Action column separately
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
          onClick={() => handleShowEditUser(record)}
        >
          <img
            src={require("../../assets/images/editer.svg").default}
            alt="edit"
            className="img-fluid table_activity_img"
          />
        </button>
      </div>
    )
  };

  // 3. Final columns (conditionally add "Action" if Admin)
  const columns = useMemo(() => {
    let cols = [...baseColumns];
    if (user?.accessLevel === "Admin") {
      cols.push(actionColumn);
    }
    return cols;
  }, [user]);

  // Paging, filtering and the length menu are all CLIENT-side here: unlike
  // Voices (which pages against the server and so needs dynamic={true}),
  // getEmailTemplate fetches every row in one call. Leaving page_size at 10
  // with show_pagination off meant the table rendered exactly one page and
  // offered no way to reach the rest — 18 rows in the table, 10 reachable in
  // the panel, and the other 8 (SEND_TEAM_WELCOME, TOURNAMENT_TEAM_INVITE,
  // the tournament staff/parent invites, the join-team and DJ invites…)
  // silently unreachable rather than missing.
  const config = {
    page_size: 10,
    length_menu: [10, 50, 100, 200],
    filename: "EmailTemplates",
    no_data_text: "No Email Templates found!",
    language: {
      length_menu: "Show _MENU_ result per page",
      filter: "Filter in templates...",
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

  const history = useHistory();
  const [templateList, setTemplateList] = useState([]);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [showAddToken, setShowAddToken] = useState(false);

  const handleShowAddToken = () => setShowAddToken(true);
  const handleCloseAddToken = () => setShowAddToken(false);

  const handleShowEditUser = (record) => {
    setEditRecord(record);
    history.push("/email-template/edit", { record: record })
  };

  const handleCloseEditUser = () => {
    setEditRecord(null);
  };

  useEffect(() => {
    listTemplatedata();
  }, []);

  const listTemplatedata = async () => {
    try {
      let { status, loading, error, message, result } = await getEmailTemplate();
      if (status) {
        setTemplateList(result);
      } else {
        if (error) {
        } else if (message) {
        }
      }
    } catch (err) {
      console.log("listTemplatedata__err", err);
    }
  };

  return (
    <>
      <Container fluid className="common_bg position-relative">
        <div className="liner"></div>
        <Row>
          <Col xl={2} className="p-0 d-none d-xl-block">
            <Sidebar />
          </Col>
          <Col xl={10} lg={12}>
            <Header title="Email Templates" />

            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <ReactDatatable
                  config={config}
                  records={templateList}
                  columns={columns}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EmailTemplatePage;