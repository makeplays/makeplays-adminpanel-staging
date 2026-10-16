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
import { assetUrl } from "../../lib/assetUrl";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSelector } from "react-redux";
import { FaqPageModels } from "../../Modals/FaqPageModels";
import { useSport } from "../../context/sportContext";
import { HELP_CATEGORIES, helpCategoryLabel } from "../../constant/helpCategories";
import HelpFeedbackPanel from "./HelpFeedbackPanel";

const FaqPage = () => {
  const { sportId, sport } = useSport();
  
  const [list, setList] = useState();
  // "all" or a HELP_CATEGORIES value; narrows the table before the text filter.
  const [categoryFilter, setCategoryFilter] = useState("all");
  // pageNumer/limit/count all went with the server-side paging that
  // listAllFaq never implemented — it ignores page, limit and search and
  // returns every row. The table owns paging, filtering and the record
  // count itself now, straight from `records`.
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
      // Keyed on the label, not the stored id: the table's filter box searches
      // the value under each column key, so "getting started" only matches the
      // text an admin can see, never the stored "getting-started".
      key: "categoryLabel",
      text: "Category",
      sortable: true,
      cell: (record) => (
        <p className="text-center m-0">{helpCategoryLabel(record?.category)}</p>
      ),
    },
    {
      key: "scope",
      text: "Applies to",
      sortable: false,
      cell: (record) => (
        <p className="text-center m-0">
          <span className={`scope_badge ${record?.sportId ? "is_sport" : ""}`}>
            {record?.sportId ? record?.sportName ?? "This sport" : "All Sports"}
          </span>
        </p>
      ),
    },
    {
      // Clamped to two lines. Answers are multi-step instructions — several
      // run past 300 characters — and at full length one row stood taller than
      // the rest of the page, which is why the table read as unpaginated even
      // where it was not. `title` keeps the whole answer reachable on hover
      // without a modal, and the edit screen still shows it in full.
      key: "answer",
      text: "Answer",
      sortable: true,
      cell: (record) => (
        <p
          className="text-center table_clamp_2 m-0"
          title={record?.answer || ""}
        >
          {record?.answer ? record.answer : "--"}
        </p>
      ),
    },
    {
      key: "image",
      text: "Image",
      sortable: false,
      cell: (record) => {
        const cover = record?.images?.[0] || record?.image;
        if (cover && cover !== "undefined") {
          const extra = (record?.images?.length || 1) - 1;
          return (
            <div className="tableFaqImgViewCard" style={{ position: "relative" }}>
              <img
                src={assetUrl(cover, `${key.IMAGE_URL}/Faq/`)}
              />{" "}
              {extra > 0 && (
                <span
                  style={{
                    position: "absolute", right: 6, bottom: 6, padding: "1px 7px", borderRadius: 10,
                    fontSize: 11, background: "rgba(0,0,0,0.65)", color: "#fff",
                  }}
                >
                  +{extra}
                </span>
              )}
            </div>
          );
        }
        else {
          // A bare "No Image" string sat at a different height to the 120px
          // image cards beside it, so rows with and without artwork did not
          // line up. The placeholder occupies the same box the image would.
          return (
            <div className="tableFaqImgViewCard table_media_placeholder">
              <span>No Image</span>
            </div>
          );
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
              <video src={assetUrl(record.video, `${key.IMAGE_URL}/Faq/`)} controls></video>
              {" "}
            </div>
          );
        }
        else {
          // Same reasoning as the image column, sized to the 220x130 the
          // video element uses.
          return (
            <div className="tableVideoViewCard table_media_placeholder is_video">
              <span>No Video</span>
            </div>
          );
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
    if (!sportId) return;
    getAllFaq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportId]);

  // Every row carries its category label (what the filter box searches), and
  // the dropdown narrows by category id. A row with no category counts as
  // "Other questions", the same as in the app.
  const categorized = useMemo(
    () => (list ?? []).map((r) => ({ ...r, categoryLabel: helpCategoryLabel(r.category) })),
    [list]
  );
  const categoryCounts = useMemo(() => {
    const counts = {};
    categorized.forEach((r) => {
      const id = r.category || "more";
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [categorized]);
  const visibleRecords = useMemo(
    () => (categoryFilter === "all" ? categorized : categorized.filter((r) => (r.category || "more") === categoryFilter)),
    [categorized, categoryFilter]
  );

  const getAllFaq = async (reqData) => {
    try {
      let { status, loading, error, message, result } = await listAllFaq({ ...reqData, sportId });
      if (status) {
        setList(result);
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

  // Client-side paging, filtering and length menu, matching Email Templates:
  // listAllFaq returns every row in one call, so the table has the whole set
  // to work with. The filter box searches every column it is given, which is
  // what makes the question AND the answer text findable.
  //
  // show_length_menu and show_filter were both false, and the filename and
  // no_data_text were still the ones copied from the Email Template page — so
  // the FAQ table offered no search, no page-size control and told anyone who
  // emptied it that no email templates were found.
  const config = {
    page_size: 10,
    length_menu: [10, 50, 100, 200],
    filename: "Faqs",
    no_data_text: "No FAQs found!",
    language: {
      length_menu: "Show _MENU_ result per page",
      filter: "Filter in FAQs...",
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
                <div className="px-3 pt-3">
                  <HelpFeedbackPanel onReplace={(question) => history.push("/faq/add", { question })} />
                </div>

                <div className="d-flex justify-content-between align-items-center px-3 my-3 flex-wrap gap-2">
                  {/* <div className="cmn_extraBtnsHolder table_extrabtns d-flex justify-content-start align-items-center ">
                    <Exportexcel excelData={sportsList} fileName={"users"} />
                    <p className="m-0 cmn_extraBtnsLabel">Exports</p>
                  </div> */}
                  <select
                    className="form-select"
                    style={{ maxWidth: 320 }}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter FAQs by category"
                  >
                    <option value="all">All categories ({categorized.length})</option>
                    {HELP_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label} ({categoryCounts[c.value] || 0})
                      </option>
                    ))}
                  </select>
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

                {/*
                  Client-side, like Email Templates. `dynamic={true}` hands
                  paging, sorting and filtering to the server — but
                  listAllFaq ignores page, limit and search outright: it
                  selects every faq row for the sport and returns the lot.
                  So the table was deferring to a server that does not page,
                  which is why the filter box and length menu had to be
                  switched off to keep it coherent.

                  With the full set already in `records`, the table can do
                  all three itself, and the filter searches every column —
                  question, answer, identifier and scope alike.
                */}
                {/* key={categoryFilter} remounts the table on each category change.
                    It keeps its own page number and never resets it when `records`
                    changes, so being on page 2 and picking a category with a few
                    rows left it asking for page 2 of 1 — an empty table. */}
                <ReactDatatable
                  key={categoryFilter}
                  config={config}
                  records={visibleRecords}
                  columns={columns}
                  extraButtons={extraButtons}
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
