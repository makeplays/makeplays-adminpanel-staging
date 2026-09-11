// Coupon codes — list, create, disable, and stock the Apple code pool.
//
// Admin creates codes freely here (name, category, expiry, cap) and points each
// at a DISCOUNT SLOT — an offer already registered in App Store Connect / Play
// Console. The slot carries the price; this screen never does. See
// config/supabaseCoupons.js and migration 20260908000001_coupon_codes.sql.
import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row, Modal } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import ReactDatatable from "@ashvin27/react-datatable";
import { useHistory } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import Papa from "papaparse";
import { useSelector } from "react-redux";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import {
  listAllCoupons,
  DisableCoupon,
  listDiscountSlots,
  getApplePoolStatus,
  UploadAppleCodes,
  UpdateSlotStoreIds,
  listAppleCodes,
  DeleteAppleCode,
  ClearUnassignedAppleCodes,
} from "../../config/supabaseCoupons";

// One place for the state colours so the table and the legend agree.
const STATE_CLASS = {
  Live: "text-success",
  Scheduled: "text-info",
  Expired: "text-secondary",
  "Fully claimed": "text-warning",
  Disabled: "text-danger",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const CouponPage = () => {
  const [list, setList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [pool, setPool] = useState([]);
  const [count, setCount] = useState(0);
  const history = useHistory();

  const user = useSelector((state) => state.isRun);
  const isAdmin = user?.accessLevel === "Admin";

  const baseColumns = [
    {
      key: "code",
      text: "Code",
      sortable: true,
      cell: (record) => (
        <p className="m-0 text-center fw-bold">{record?.code || "--"}</p>
      ),
    },
    {
      key: "category",
      text: "Category",
      sortable: true,
      cell: (record) => (
        <p className="m-0 text-center text-capitalize">{record?.category || "--"}</p>
      ),
    },
    {
      key: "slotLabel",
      text: "Discount",
      sortable: true,
      cell: (record) => (
        <div className="text-center">
          <p className="m-0">{record?.slotLabel || "--"}</p>
          {/* A slot with no store id on a platform cannot be redeemed there.
              Surfaced per-row so admin never hands out a code that silently
              charges full price. */}
          <small style={{ color: "var(--placeholder)" }}>
            {record?.appleOfferId ? "iOS ✓" : "iOS —"}
            {"  "}
            {record?.googleOfferId ? "Android ✓" : "Android —"}
          </small>
        </div>
      ),
    },
    {
      key: "state",
      text: "Status",
      sortable: true,
      cell: (record) => (
        <p className={`m-0 text-center fw-semibold ${STATE_CLASS[record?.state] || ""}`}>
          {record?.state || "--"}
        </p>
      ),
    },
    {
      key: "redeemedCount",
      text: "Claimed",
      sortable: true,
      cell: (record) => (
        <p className="m-0 text-center">
          {record?.redeemedCount ?? 0}
          {record?.maxRedemptions != null ? ` / ${record.maxRedemptions}` : " / ∞"}
        </p>
      ),
    },
    {
      key: "validUntil",
      text: "Expires",
      sortable: true,
      cell: (record) => (
        <p className="m-0 text-center">
          {record?.validUntil ? fmtDate(record.validUntil) : "No expiry"}
        </p>
      ),
    },
    {
      key: "oncePerUserEver",
      text: "One per person",
      sortable: false,
      cell: (record) => (
        <p className="m-0 text-center">{record?.oncePerUserEver ? "Yes" : "No"}</p>
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
          title="Edit"
          onClick={() => history.push("/coupons/edit", { record })}
        >
          <img
            src={require("../../assets/images/editer.svg").default}
            className="img-fluid table_activity_img"
            alt="Edit"
          />
        </button>
        {record?.active ? (
          <button
            className="cmn_plain_btn"
            title="Disable"
            onClick={() => handleShowDisable(record)}
          >
            <img
              src={require("../../assets/images/trash.svg").default}
              className="img-fluid table_activity_img"
              alt="Disable"
            />
          </button>
        ) : null}
      </div>
    ),
  };

  const columns = useMemo(() => {
    const cols = [...baseColumns];
    if (isAdmin) cols.push(actionColumn);
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    getAllCoupons();
    getSlots();
    getPool();
  }, []);

  const getAllCoupons = async () => {
    try {
      const { status, message, result, count: total } = await listAllCoupons();
      if (status) {
        setList(result);
        setCount(total);
      } else if (message) {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("getAllCoupons__err", err);
    }
  };

  const getSlots = async () => {
    try {
      const { status, result } = await listDiscountSlots();
      if (status) setSlots(result);
    } catch (err) {
      console.log("getSlots__err", err);
    }
  };

  const getPool = async () => {
    try {
      const { status, result } = await getApplePoolStatus();
      if (status) setPool(result);
    } catch (err) {
      console.log("getPool__err", err);
    }
  };

  // ─── disable ──────────────────────────────────────────────────────────────
  const [showDisable, setShowDisable] = useState(false);
  const [disableRecord, setDisableRecord] = useState({});
  const handleShowDisable = (record) => {
    setDisableRecord(record);
    setShowDisable(true);
  };
  const handleCloseDisable = () => setShowDisable(false);

  const handleConfirmDisable = async () => {
    try {
      const { status, message } = await DisableCoupon({ couponId: disableRecord._id });
      if (status) {
        CustomToastHandler({ msg: message });
        getAllCoupons();
      } else if (message) {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("handleConfirmDisable__err", err);
      CustomToastHandler({ msg: "Could not disable that coupon.", type: "error" });
    } finally {
      handleCloseDisable();
    }
  };

  // ─── store IDs ────────────────────────────────────────────────────────────
  // The reference name from App Store Connect / the Play offer id. Until these
  // are recorded, a coupon pointing at the slot cannot resolve at the store —
  // which is why every slot card reads "Not registered" on a fresh install.
  const [showIds, setShowIds] = useState(false);
  const [idsSlot, setIdsSlot] = useState(null);
  const [appleId, setAppleId] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [savingIds, setSavingIds] = useState(false);

  const handleEditIds = (slot) => {
    setIdsSlot(slot);
    setAppleId(slot.appleOfferId || "");
    setGoogleId(slot.googleOfferId || "");
    setShowIds(true);
  };

  const handleSaveIds = async () => {
    if (savingIds || !idsSlot) return;
    setSavingIds(true);
    try {
      const { status, message } = await UpdateSlotStoreIds({
        slotId: idsSlot._id,
        appleOfferId: appleId.trim(),
        googleOfferId: googleId.trim(),
      });
      CustomToastHandler({ msg: message, type: status ? "success" : "error" });
      if (status) {
        setShowIds(false);
        getSlots();
        // Coupon rows carry the slot's store ids, so refresh those too or the
        // per-row "iOS ✓ / Android —" badges go stale.
        getAllCoupons();
      }
    } catch (err) {
      console.log("handleSaveIds__err", err);
      CustomToastHandler({ msg: "Could not save those IDs.", type: "error" });
    } finally {
      setSavingIds(false);
    }
  };

  // ─── Apple pool upload ────────────────────────────────────────────────────
  const [showPool, setShowPool] = useState(false);
  const [poolSlot, setPoolSlot] = useState("");
  const [poolCodes, setPoolCodes] = useState("");
  const [uploading, setUploading] = useState(false);

  // Apple exports the code list as CSV, so read the file directly rather than
  // making admin open it and copy a column. Papa is already a dependency (the
  // FAQ importer uses it).
  const [fileName, setFileName] = useState("");
  const handleCodeFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      CustomToastHandler({ msg: "Choose the .csv file Apple gave you.", type: "error" });
      return;
    }
    setFileName(file.name);
    Papa.parse(file, {
      // No header:true — Apple's export is a single unlabelled column, and
      // treating row 1 as a header would silently drop a real code.
      skipEmptyLines: true,
      complete: (results) => {
        // Flatten every cell; UploadAppleCodes filters out anything that
        // isn't code-shaped, including a header if one is present.
        const codes = (results.data || [])
          .flat()
          .map((c) => String(c || "").trim())
          .filter(Boolean);
        if (!codes.length) {
          CustomToastHandler({ msg: "No codes found in that file.", type: "error" });
          return;
        }
        setPoolCodes(codes.join("\n"));
        CustomToastHandler({ msg: `${codes.length} codes read from ${file.name}` });
      },
      error: (err) => {
        console.log("handleCodeFile__err", err);
        CustomToastHandler({ msg: "Could not read that file.", type: "error" });
      },
    });
  };

  // ─── manage an existing pool ──────────────────────────────────────────────
  const [poolCodeList, setPoolCodeList] = useState([]);
  const [managingSlot, setManagingSlot] = useState(null);

  const loadPoolCodes = async (slotId) => {
    const { status, result } = await listAppleCodes(slotId);
    if (status) setPoolCodeList(result);
  };

  const handleManagePool = async (slot) => {
    setManagingSlot(slot);
    setPoolSlot(slot._id);
    await loadPoolCodes(slot._id);
    setShowPool(true);
  };

  const handleDeleteCode = async (codeId) => {
    const { status, message } = await DeleteAppleCode({ codeId });
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      loadPoolCodes(poolSlot);
      getPool();
    }
  };

  const handleClearPool = async () => {
    const { status, message } = await ClearUnassignedAppleCodes({ discountSlotId: poolSlot });
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      loadPoolCodes(poolSlot);
      getPool();
    }
  };

  const handleUploadCodes = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const { status, message } = await UploadAppleCodes({
        discountSlotId: poolSlot,
        codes: poolCodes,
      });
      CustomToastHandler({ msg: message, type: status ? "success" : "error" });
      if (status) {
        setPoolCodes("");
        setFileName("");
        getPool();
        // Stay open and show the result, so admin can see the codes landed
        // rather than trusting a toast.
        if (poolSlot) loadPoolCodes(poolSlot);
      }
    } catch (err) {
      console.log("handleUploadCodes__err", err);
      CustomToastHandler({ msg: "Could not add those codes.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const config = {
    page_size: 10,
    length_menu: [10, 20, 50],
    filename: "Coupons",
    no_data_text: "No coupon codes yet. Create one to get started.",
    language: {
      length_menu: "Show _MENU_ result per page",
      filter: "Search codes...",
      info: "Showing _START_ to _END_ of _TOTAL_ records",
      pagination: { first: "First", previous: "Previous", next: "Next", last: "Last" },
    },
    show_length_menu: false,
    show_filter: true,
    show_pagination: true,
    show_info: false,
  };

  // Slots with no Apple codes stocked can still be used — the app falls back to
  // Apple's own sheet — but prefilling is much better UX, so surface the gap.
  const lowPool = pool.filter((p) => !p.unknown && p.available <= 5);

  return (
    <>
      <Container fluid className="common_bg position-relative">
        <div className="liner"></div>
        <Row>
          <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
            <Sidebar />
          </Col>
          <Col xl={10} lg={12}>
            <Header title={"Coupons"} />
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">

              {/* Store-registration status. A coupon can only work where its
                  discount is registered, so this is the first thing to check
                  when a code "doesn't apply". */}
              <div className="dashboard_box rounded-3 mt-4 p-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <p className="cp_section_title">Discounts registered in the stores</p>
                    <p className="cp_hint">
                      Codes can only be redeemed where the discount is registered.
                      {isAdmin ? " Use Store IDs to record what you registered, and Codes to load Apple\u2019s list." : ""}
                    </p>
                  </div>
                  {isAdmin ? (
                    <button
                      className="exchange_tableFileUploader table_extrabtns"
                      onClick={() => setShowPool(true)}
                    >
                      <p className="cmn_extraBtnsLabel m-0">Add Apple codes</p>
                    </button>
                  ) : null}
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3">
                  {slots.length === 0 ? (
                    <p className="cp_hint">No discounts configured yet.</p>
                  ) : (
                    slots.map((slot) => {
                      const p = pool.find((x) => x._id === slot._id);
                      const registered = slot.registeredOn !== "Not registered";
                      return (
                        <div key={slot._id} className="cp_slot_card">
                          <p className="cp_slot_title">{slot.label}</p>
                          {/* Which product this discount belongs to. Without it
                              a "10% off yearly" label is easy to pair with a
                              monthly Apple offer by mistake. */}
                          <p className="cp_hint" style={{ fontFamily: "monospace" }}>
                            {slot.targetProductId}
                          </p>
                          <p className={`cp_hint ${registered ? "" : "cp_hint_warn"}`}>
                            {slot.registeredOn}
                            {slot.appleOfferId ? ` · ${slot.appleOfferId}` : ""}
                          </p>
                          <p className={`cp_hint ${p?.unknown ? "cp_hint_warn" : ""}`}>
                            Apple pool:{" "}
                            {p?.unknown
                              ? "could not be read — reload"
                              : p
                                ? `${p.available} available`
                                : "empty"}
                          </p>
                          {isAdmin ? (
                            <div className="d-flex gap-3 mt-2">
                              <button
                                className="cmn_plain_btn cp_hint"
                                onClick={() => handleEditIds(slot)}
                              >
                                Store IDs
                              </button>
                              <button
                                className="cmn_plain_btn cp_hint"
                                onClick={() => handleManagePool(slot)}
                              >
                                Codes
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
                {lowPool.length > 0 ? (
                  <p className="cp_hint cp_hint_warn mt-2">
                    Running low on Apple codes for:{" "}
                    {lowPool.map((p) => p.label).join(", ")}. Generate more in App Store
                    Connect and add them here.
                  </p>
                ) : null}
              </div>

              <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
                <div className="d-flex justify-content-end align-items-center px-3 my-3">
                  <div className="d-flex justif-content-end align-items-center gap-2">
                    {isAdmin ? (
                      <button
                        className="exchange_tableFileUploader table_extrabtns"
                        onClick={() => history.push("/coupons/add")}
                      >
                        <IoIosAdd size={25} />
                        <p className="cmn_extraBtnsLabel m-0">Create coupon</p>
                      </button>
                    ) : null}
                  </div>
                </div>

                <ReactDatatable
                  config={config}
                  records={list}
                  columns={columns}
                  total_record={count}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Disable confirmation. Deliberately "disable", not "delete": people may
          still hold the code, and the campaign's numbers are worth keeping. */}
      <Modal show={showDisable} onHide={handleCloseDisable} centered className="cmn_modal">
        <Modal.Body>
          <div className="cmn_modal_header d-flex justify-content-between align-items-center">
            <p className="cmn_modal_title">Disable coupon</p>
            <button className="cmn_modal_closer rounded-5" onClick={handleCloseDisable}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="mt-3">
            <p className="rp_label mb-2">
              {disableRecord?.code} will stop working immediately.
            </p>
            <p className="cp_hint">
              Anyone already holding it will be told it isn't valid. Redemption history
              is kept, so your campaign figures stay intact.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button className="secondary_btn mt-4 w-25" onClick={handleCloseDisable}>
                Keep it
              </button>
              <button className="orange_small_primary mt-4 w-25" onClick={handleConfirmDisable}>
                Disable
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Apple one-time code pool. Apple generates these in App Store Connect;
          pasting them here lets the app prefill the redemption sheet. */}
      <Modal show={showPool} onHide={() => setShowPool(false)} centered size="lg" className="cmn_modal">
        <Modal.Body>
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-3">
            <p className="cmn_modal_title">Add Apple offer codes</p>
            <button className="cmn_modal_closer rounded-5" onClick={() => setShowPool(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <p className="cp_hint mb-3">
            In App Store Connect, open the subscription's offer, download the one-time
            code list, and paste the codes below. Codes already added are skipped.
            Use the <strong>Sandbox</strong> batch while testing.
          </p>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Discount</p>
            <div className="rp_input_holder py-2 px-3 rounded-2">
              <select
                className="rp_singleInput flex-grow-1 w-100"
                value={poolSlot}
                onChange={(e) => {
                  const id = e.target.value;
                  setPoolSlot(id);
                  // Showing another slot's codes would be actively misleading,
                  // so swap the list with the selection.
                  const slot = slots.find((x) => x._id === id) || null;
                  setManagingSlot(slot);
                  setPoolCodeList([]);
                  if (id) loadPoolCodes(id);
                }}
              >
                <option value="">Choose a discount…</option>
                {slots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.label}{" "}
                    {slot.appleOfferId ? `(${slot.appleOfferId})` : "(not registered on iOS)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Upload Apple's CSV</p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="rp_singleInput w-100"
              onChange={handleCodeFile}
            />
            <p className="cp_hint">
              {fileName
                ? `Read from ${fileName} — check the list below, then Add codes.`
                : "Choose the file you downloaded from App Store Connect, or paste below."}
            </p>
          </div>

          <div className="rp_singleinput_holder">
            <p className="rp_label mb-2">Codes</p>
            <div className="rp_input_holder py-2 px-3 rounded-2">
              <textarea
                className="rp_singleInput w-100 flex-grow-1"
                rows={6}
                placeholder={"XXXX-XXXX\nYYYY-YYYY\nZZZZ-ZZZZ"}
                value={poolCodes}
                onChange={(e) => setPoolCodes(e.target.value)}
              />
            </div>
            <p className="cp_hint">
              {poolCodes.trim()
                ? `${poolCodes.trim().split(/[\s,]+/).filter(Boolean).length} codes ready to add.`
                : "One per line, or comma-separated. A header row is ignored."}
            </p>
          </div>

          {/* Existing pool for this slot. Assigned codes are shown but not
              deletable — a user is mid-redemption with one, and it is their
              only route to the discount. */}
          {managingSlot && poolCodeList.length > 0 ? (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <p className="rp_label m-0">
                  In this pool ({poolCodeList.filter((c) => !c.assigned).length} available,{" "}
                  {poolCodeList.filter((c) => c.assigned).length} assigned)
                </p>
                {poolCodeList.some((c) => !c.assigned) ? (
                  <button className="cmn_plain_btn cp_hint" onClick={handleClearPool}>
                    Remove all unassigned
                  </button>
                ) : null}
              </div>
              <div
                className="rp_input_holder rounded-2 p-2"
                style={{ maxHeight: 180, overflowY: "auto" }}
              >
                {poolCodeList.map((c) => (
                  <div
                    key={c._id}
                    className="d-flex justify-content-between align-items-center py-1"
                  >
                    <span className="cp_hint" style={{ fontFamily: "monospace" }}>
                      {c.code} {c.assigned ? "· assigned" : ""}
                    </span>
                    {c.assigned ? null : (
                      <button
                        className="cmn_plain_btn cp_hint"
                        title="Remove this code"
                        onClick={() => handleDeleteCode(c._id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="d-flex justify-content-center gap-2">
            <button
              className="secondary_btn mt-4 w-25"
              onClick={() => {
                setShowPool(false);
                setManagingSlot(null);
                setPoolCodeList([]);
                setPoolCodes("");
                setFileName("");
              }}
            >
              Close
            </button>
            <button
              className="orange_small_primary mt-4 w-25"
              disabled={!poolSlot || !poolCodes.trim() || uploading}
              onClick={handleUploadCodes}
            >
              {uploading ? "Adding…" : "Add codes"}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Record the store-side identifiers. Until these exist, a coupon pointing
          at this slot validates on our side but applies no discount at the
          store — the worst failure mode, so the copy says so plainly. */}
      <Modal show={showIds} onHide={() => setShowIds(false)} centered className="cmn_modal">
        <Modal.Body>
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-3">
            <p className="cmn_modal_title">{idsSlot?.label} — store IDs</p>
            <button className="cmn_modal_closer rounded-5" onClick={() => setShowIds(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          {/* The product is what makes the pairing unambiguous — "10% off
              yearly" alone reads the same as the monthly slot at a glance. */}
          <p className="cp_hint mb-1">
            Applies to{" "}
            <span style={{ fontFamily: "monospace" }}>{idsSlot?.targetProductId}</span>
          </p>
          <p className="cp_hint mb-3">
            Paste the identifiers you registered in each store — they must be the offer
            on THIS product. Leave one blank if the discount isn't live there yet: the
            app then tells those customers the code isn't available on their platform,
            rather than charging them full price.
          </p>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Apple offer reference name</p>
            <div className="rp_input_holder py-2 px-3 rounded-2">
              <input
                type="text"
                className="rp_singleInput flex-grow-1 w-100"
                placeholder="mp_monthly_10"
                value={appleId}
                onChange={(e) => setAppleId(e.target.value)}
              />
            </div>
            <p className="cp_hint">
              App Store Connect → the subscription → Offer Codes → the offer's
              Reference Name.
            </p>
          </div>
          <div className="rp_singleinput_holder">
            <p className="rp_label mb-2">Google Play offer ID</p>
            <div className="rp_input_holder py-2 px-3 rounded-2">
              <input
                type="text"
                className="rp_singleInput flex-grow-1 w-100"
                placeholder="monthly-10off"
                value={googleId}
                onChange={(e) => setGoogleId(e.target.value)}
              />
            </div>
            <p className="cp_hint">
              Play Console → the subscription → the base plan → the offer's ID.
            </p>
          </div>
          <div className="d-flex justify-content-center gap-2">
            <button className="secondary_btn mt-4 w-25" onClick={() => setShowIds(false)}>
              Cancel
            </button>
            <button
              className="orange_small_primary mt-4 w-25"
              disabled={savingIds}
              onClick={handleSaveIds}
            >
              {savingIds ? "Saving…" : "Save IDs"}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CouponPage;
