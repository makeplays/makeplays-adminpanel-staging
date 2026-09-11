// Edit a coupon.
//
// The code itself and the discount it points at are deliberately NOT editable.
// People may already be holding the code, and repointing it at a different
// discount would silently change what an outstanding code is worth — a 10% code
// quietly becoming 25%, or vice versa, with no way for the holder to know.
// To change either, disable this coupon and create a new one.
import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import { useHistory, useLocation } from "react-router-dom";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EditCoupon, listCouponRedemptions } from "../../config/supabaseCoupons";

// datetime-local needs 'YYYY-MM-DDTHH:mm' in LOCAL time; a raw ISO string is
// rejected silently and the field renders blank.
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

// datetime-local wants local wall-clock time, so this is toLocalInput(now).
const nowLocalInput = () => toLocalInput(new Date().toISOString());

const EditCouponPage = () => {
  const history = useHistory();
  const location = useLocation();
  const record = location?.state?.record;

  const [form, setForm] = useState({
    category: "",
    validFrom: "",
    validUntil: "",
    maxRedemptions: "",
    oncePerUserEver: false,
    active: true,
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    // Reached by a page refresh or a pasted URL: there is no record in history
    // state, so there is nothing to edit.
    if (!record) {
      history.push("/coupons");
      return;
    }
    setForm({
      category: record.category ?? "support",
      validFrom: toLocalInput(record.validFrom),
      validUntil: toLocalInput(record.validUntil),
      maxRedemptions: record.maxRedemptions == null ? "" : String(record.maxRedemptions),
      oncePerUserEver: !!record.oncePerUserEver,
      active: !!record.active,
      notes: record.notes ?? "",
    });

    (async () => {
      const { status, result } = await listCouponRedemptions();
      if (status) setRedemptions(result.filter((r) => r.code === record.code));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.maxRedemptions !== "" && Number(form.maxRedemptions) < 1) {
      next.maxRedemptions = "Leave blank for unlimited, or enter 1 or more.";
    }
    // Lowering the cap below what has already been claimed would show a
    // nonsense "12 / 5" in the list, so refuse it here.
    if (
      form.maxRedemptions !== "" &&
      record?.redeemedCount != null &&
      Number(form.maxRedemptions) < record.redeemedCount
    ) {
      next.maxRedemptions = `Already claimed ${record.redeemedCount} times — the cap can't be lower than that.`;
    }
    if (form.validFrom && form.validUntil &&
        new Date(form.validUntil) <= new Date(form.validFrom)) {
      next.validUntil = "The end date must be after the start date.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
      const { status, message } = await EditCoupon({ couponId: record._id, ...form });
      if (status) {
        CustomToastHandler({ msg: message });
        history.push("/coupons");
      } else {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("EditCoupon__err", err);
      CustomToastHandler({ msg: "Could not update that coupon.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!record) return null;

  const confirmed = redemptions.filter((r) => r.status === "confirmed").length;
  const reserved = redemptions.filter((r) => r.status === "reserved").length;

  return (
    <Container fluid className="common_bg position-relative">
      <div className="liner"></div>
      <Row>
        <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
          <Sidebar />
        </Col>
        <Col xl={10} lg={12}>
          <Header title={"Edit coupon"} />
          <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">

            {/* Fixed facts, shown read-only so it's obvious why they aren't fields. */}
            <div className="dashboard_box rounded-3 mt-4 p-4">
              <Row>
                <Col md={4}>
                  <p className="cp_hint">Code</p>
                  <h5 className="m-0">{record.code}</h5>
                </Col>
                <Col md={4}>
                  <p className="cp_hint">Discount</p>
                  <h5 className="m-0">{record.slotLabel}</h5>
                  <p className="cp_hint">
                    {record.appleOfferId ? "iOS ✓" : "iOS —"}{"  "}
                    {record.googleOfferId ? "Android ✓" : "Android —"}
                  </p>
                </Col>
                <Col md={4}>
                  <p className="cp_hint">Claimed</p>
                  <h5 className="m-0">
                    {confirmed} confirmed
                    {reserved ? `, ${reserved} in progress` : ""}
                  </h5>
                </Col>
              </Row>
              <p className="cp_hint mt-3">
                The code and its discount can't be changed — people may already be
                holding this code. Disable it and create a new one instead.
              </p>
            </div>

            <div className="dashboard_box rounded-3 mt-4 p-4">
              <form onSubmit={handleSubmit}>
                <Row>
                  <Col lg={6} className="mb-3">
                    <p className="rp_label mb-2">Category</p>
                    <div className="rp_input_holder py-2 px-3 rounded-2">
                      <input
                        type="text"
                        className="rp_singleInput flex-grow-1 w-100"
                        value={form.category}
                        onChange={set("category")}
                      />
                    </div>
                  </Col>

                  <Col lg={6} className="mb-3 d-flex align-items-center">
                    <div className="form-check mt-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="active"
                        checked={form.active}
                        onChange={set("active")}
                      />
                      <label className="rp_label form-check-label" htmlFor="active">
                        Active
                      </label>
                      <p className="cp_hint">
                        Uncheck to stop the code working immediately.
                      </p>
                    </div>
                  </Col>

                  <Col lg={6} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <p className="rp_label m-0">Starts</p>
                      {/* Safari's datetime-local picker has no clear control, so
                          "leave blank" is unreachable without these. */}
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className="cmn_plain_btn cp_hint"
                          onClick={() => setForm((f) => ({ ...f, validFrom: nowLocalInput() }))}
                        >
                          Set to now
                        </button>
                        <button
                          type="button"
                          className="cmn_plain_btn cp_hint"
                          onClick={() => setForm((f) => ({ ...f, validFrom: "" }))}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="rp_input_holder py-2 px-3 rounded-2">
                      <input
                        type="datetime-local"
                        className="rp_singleInput flex-grow-1 w-100"
                        value={form.validFrom}
                        onChange={set("validFrom")}
                      />
                    </div>
                    <p className="cp_hint">Leave blank to start immediately.</p>
                  </Col>

                  <Col lg={6} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <p className="rp_label m-0">Expires</p>
                      <button
                        type="button"
                        className="cmn_plain_btn cp_hint"
                        onClick={() => setForm((f) => ({ ...f, validUntil: "" }))}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="rp_input_holder py-2 px-3 rounded-2">
                      <input
                        type="datetime-local"
                        className="rp_singleInput flex-grow-1 w-100"
                        value={form.validUntil}
                        onChange={set("validUntil")}
                      />
                    </div>
                    {errors.validUntil ? (
                      <small className="text-danger">{errors.validUntil}</small>
                    ) : (
                      <p className="cp_hint">Leave blank for no expiry.</p>
                    )}
                  </Col>

                  <Col lg={6} className="mb-3">
                    <p className="rp_label mb-2">Maximum redemptions</p>
                    <div className="rp_input_holder py-2 px-3 rounded-2">
                      <input
                        type="number"
                        min={1}
                        className="rp_singleInput flex-grow-1 w-100"
                        placeholder="Unlimited"
                        value={form.maxRedemptions}
                        onChange={set("maxRedemptions")}
                      />
                    </div>
                    {errors.maxRedemptions ? (
                      <small className="text-danger">{errors.maxRedemptions}</small>
                    ) : (
                      <p className="cp_hint">Leave blank for unlimited.</p>
                    )}
                  </Col>

                  <Col lg={6} className="mb-3 d-flex align-items-center">
                    <div className="form-check mt-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="oncePerUserEverEdit"
                        checked={form.oncePerUserEver}
                        onChange={set("oncePerUserEver")}
                      />
                      <label className="rp_label form-check-label" htmlFor="oncePerUserEverEdit">
                        One discount per person, ever
                      </label>
                    </div>
                  </Col>

                  <Col lg={12} className="mb-3">
                    <p className="rp_label mb-2">Notes</p>
                    <div className="rp_input_holder py-2 px-3 rounded-2">
                      <textarea
                        className="rp_singleInput w-100 flex-grow-1"
                        rows={3}
                        value={form.notes}
                        onChange={set("notes")}
                      />
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => history.push("/coupons")}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Who redeemed it. 'In progress' means a code was applied but the
                purchase never completed — a useful signal on its own. */}
            {redemptions.length > 0 ? (
              <div className="dashboard_box rounded-3 mt-4 p-4">
                <p className="cp_section_title mb-3">Redemptions</p>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Product</th>
                        <th>Applied</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.map((r) => (
                        <tr key={r._id}>
                          <td className={r.status === "confirmed" ? "text-success" : "text-warning"}>
                            {r.status === "confirmed" ? "Confirmed" : "In progress"}
                          </td>
                          <td>{r.productId || "—"}</td>
                          <td>{r.reservedAt ? new Date(r.reservedAt).toLocaleString() : "—"}</td>
                          <td>{r.confirmedAt ? new Date(r.confirmedAt).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default EditCouponPage;
