// Create a coupon code.
//
// The admin picks a name, a category, an expiry and a cap, then chooses which
// DISCOUNT SLOT it unlocks. Slots are the offers already registered in App
// Store Connect / Play Console — they carry the price, and this form cannot
// change it. Many coupons may point at the same slot, which is what lets admin
// run unlimited campaigns without an App Review each time.
//
// STYLING: uses the panel's own rp_label / rp_input_holder / rp_singleInput
// classes, NOT Bootstrap's form-label / text-muted. Those assume a light
// background and render near-invisible on this dark theme.
import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import { useHistory } from "react-router-dom";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { AddCoupon, listDiscountSlots } from "../../config/supabaseCoupons";

// Suggestions, not a fixed list — `category` is free text in the database so
// admin can invent 'staff', 'launch', a tournament name, with no migration.
const CATEGORY_SUGGESTIONS = ["support", "friend"];

const initialForm = {
  code: "",
  discountSlotId: "",
  category: "support",
  validFrom: "",
  validUntil: "",
  maxRedemptions: "",
  oncePerUserEver: false,
  notes: "",
};

const AddCouponPage = () => {
  const history = useHistory();
  const [form, setForm] = useState(initialForm);
  const [slots, setSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { status, result } = await listDiscountSlots();
      if (status) setSlots(result.filter((s) => s.active));
    })();
  }, []);

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const code = form.code.trim();
    if (!code) {
      next.code = "Enter a code.";
    } else if (!/^[A-Za-z0-9_-]{3,32}$/.test(code)) {
      // Restricted to what a person can reliably read out over the phone and
      // type without ambiguity — spaces and punctuation cause support tickets.
      next.code = "Use 3–32 letters, numbers, hyphens or underscores.";
    }
    if (!form.discountSlotId) next.discountSlotId = "Choose which discount this unlocks.";
    if (form.maxRedemptions !== "" && Number(form.maxRedemptions) < 1) {
      next.maxRedemptions = "Leave blank for unlimited, or enter 1 or more.";
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
      const { status, message } = await AddCoupon(form);
      if (status) {
        CustomToastHandler({ msg: message });
        history.push("/coupons");
      } else {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("AddCoupon__err", err);
      CustomToastHandler({ msg: "Could not create that coupon.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const chosen = slots.find((s) => s._id === form.discountSlotId);

  return (
    <Container fluid className="common_bg position-relative">
      <div className="liner"></div>
      <Row>
        <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
          <Sidebar />
        </Col>
        <Col xl={10} lg={12}>
          <Header title={"Create coupon"} />
          <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
            <div className="dashboard_box rounded-3 mt-4 p-4">
              <form onSubmit={handleSubmit}>
                <Row>
                  <Col lg={6}>
                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Code</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input
                          type="text"
                          name="code"
                          className="rp_singleInput flex-grow-1 w-100 text-uppercase"
                          placeholder="SUPPORT20"
                          value={form.code}
                          onChange={set("code")}
                          maxLength={32}
                        />
                      </div>
                      {errors.code ? (
                        <p className="cp_hint text-danger">{errors.code}</p>
                      ) : (
                        <p className="cp_hint">
                          What the customer types. Case doesn't matter when they enter it.
                        </p>
                      )}
                    </div>
                  </Col>

                  <Col lg={6}>
                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Category</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input
                          type="text"
                          name="category"
                          list="coupon-categories"
                          className="rp_singleInput flex-grow-1 w-100"
                          placeholder="support"
                          value={form.category}
                          onChange={set("category")}
                        />
                      </div>
                      <datalist id="coupon-categories">
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                      <p className="cp_hint">
                        For your own grouping and reporting. Type anything you like.
                      </p>
                    </div>
                  </Col>

                  <Col lg={12}>
                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Discount this unlocks</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <select
                          name="discountSlotId"
                          className="rp_singleInput flex-grow-1 w-100"
                          value={form.discountSlotId}
                          onChange={set("discountSlotId")}
                        >
                          <option value="">Choose a discount…</option>
                          {slots.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.label} — {s.registeredOn}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.discountSlotId ? (
                        <p className="cp_hint text-danger">{errors.discountSlotId}</p>
                      ) : (
                        <p className="cp_hint">
                          The discounted price comes from the app stores, not from here.
                        </p>
                      )}
                      {/* Registering the offer is a separate, review-gated step.
                          Warn now rather than after codes have been handed out. */}
                      {chosen && chosen.registeredOn === "Not registered" ? (
                        <p className="cp_hint cp_hint_warn">
                          This discount isn't registered in either store yet, so the code
                          won't apply until it is.
                        </p>
                      ) : null}
                      {chosen && !chosen.googleOfferId && chosen.appleOfferId ? (
                        <p className="cp_hint cp_hint_warn">
                          iOS only — Android users won't be able to redeem this yet.
                        </p>
                      ) : null}
                    </div>
                  </Col>

                  <Col lg={6}>
                    <div className="rp_singleinput_holder mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="rp_label m-0">Starts</p>
                        {/* Safari's picker offers no way to empty the field, so
                            the "leave blank" path needs an explicit control. */}
                        {form.validFrom ? (
                          <button
                            type="button"
                            className="cmn_plain_btn cp_hint"
                            onClick={() => setForm((f) => ({ ...f, validFrom: "" }))}
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input
                          type="datetime-local"
                          name="validFrom"
                          className="rp_singleInput flex-grow-1 w-100"
                          value={form.validFrom}
                          onChange={set("validFrom")}
                        />
                      </div>
                      <p className="cp_hint">Leave blank to start now.</p>
                    </div>
                  </Col>

                  <Col lg={6}>
                    <div className="rp_singleinput_holder mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="rp_label m-0">Expires</p>
                        {form.validUntil ? (
                          <button
                            type="button"
                            className="cmn_plain_btn cp_hint"
                            onClick={() => setForm((f) => ({ ...f, validUntil: "" }))}
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input
                          type="datetime-local"
                          name="validUntil"
                          className="rp_singleInput flex-grow-1 w-100"
                          value={form.validUntil}
                          onChange={set("validUntil")}
                        />
                      </div>
                      {errors.validUntil ? (
                        <p className="cp_hint text-danger">{errors.validUntil}</p>
                      ) : (
                        <p className="cp_hint">Leave blank for no expiry.</p>
                      )}
                    </div>
                  </Col>

                  <Col lg={6}>
                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Maximum redemptions</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input
                          type="number"
                          min={1}
                          name="maxRedemptions"
                          className="rp_singleInput flex-grow-1 w-100"
                          placeholder="Unlimited"
                          value={form.maxRedemptions}
                          onChange={set("maxRedemptions")}
                        />
                      </div>
                      {errors.maxRedemptions ? (
                        <p className="cp_hint text-danger">{errors.maxRedemptions}</p>
                      ) : (
                        <p className="cp_hint">
                          Leave blank for unlimited. Counted across all customers.
                        </p>
                      )}
                    </div>
                  </Col>

                  <Col lg={6}>
                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Restrictions</p>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="oncePerUserEver"
                          checked={form.oncePerUserEver}
                          onChange={set("oncePerUserEver")}
                        />
                        <label className="rp_label form-check-label" htmlFor="oncePerUserEver">
                          One discount per person, ever
                        </label>
                      </div>
                      <p className="cp_hint">
                        Refuses anyone who has already used any code marked this way —
                        stricter than the cap above.
                      </p>
                    </div>
                  </Col>

                  <Col lg={12}>
                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Notes</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <textarea
                          name="notes"
                          rows="3"
                          className="rp_singleInput w-100 flex-grow-1"
                          placeholder="What this campaign is for, who it went to…"
                          value={form.notes}
                          onChange={set("notes")}
                        />
                      </div>
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
                    {saving ? "Creating…" : "Create coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AddCouponPage;
