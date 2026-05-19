import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { isEmpty } from "../../lib/isEmpty";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import { addAnnouncementTemplate } from "../../api/adminApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";

const CATEGORY_TYPE_MAP = {
  goal: ["Unassisted", "Assisted", "SecondAssist", "OwnGoal", "PenaltyGoal"],
  penalty: ["General"],
  commentary: ["General"],
  lineup: ["General"],
  substitution: ["General"],
  foul: ["General"],
  corner: ["General"],
};

const initialFormValue = { category: "", type: "", phrase: "" };

export const AddAnnouncementTemplatePage = () => {
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleChange = (e) => {
    setErrors({});
    const { name, value } = e.target;
    if (name === "category") {
      setFormvalue({ ...formvalue, category: value, type: "" });
    } else {
      setFormvalue({ ...formvalue, [name]: value });
    }
  };

  const validate = () => {
    let err = {};
    if (isEmpty(formvalue.category)) err.category = "Category is required";
    if (isEmpty(formvalue.type)) err.type = "Type is required";
    if (isEmpty(formvalue.phrase)) err.phrase = "Phrase is required";
    return err;
  };

  const handleSubmit = async () => {
    try {
      const err = validate();
      if (!isEmpty(err)) { setErrors(err); return; }

      setLoading(true);
      const { status, message } = await addAnnouncementTemplate(formvalue);
      if (status) {
        CustomToastHandler({ msg: message });
        history.push("/announcement-template");
      } else {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("AddAnnouncementTemplate__err", err);
      CustomToastHandler({ msg: "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = CATEGORY_TYPE_MAP[formvalue.category] || [];

  return (
    <DashboardLayout>
      <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
        <section className="editPageContainer">
          <div className="cmn_modal_header d-flex justify-content-between align-items-center">
            <p className="cmn_modal_title">Add Announcement Template</p>
            <button className="backBtn" onClick={() => history.push("/announcement-template")}>
              Back
            </button>
          </div>

          <div className="mt-4">
            <div className="rp_singleinput_holder mb-3">
              <p className="rp_label mb-2">Category</p>
              <div className="rp_input_holder py-2 px-3 rounded-2">
                <select
                  name="category"
                  className="rp_singleInput flex-grow-1"
                  value={formvalue.category}
                  onChange={handleChange}>
                  <option value="">Select Category</option>
                  {Object.keys(CATEGORY_TYPE_MAP).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-danger">{errors.category}</span>
            </div>

            <div className="rp_singleinput_holder mb-3">
              <p className="rp_label mb-2">Type</p>
              <div className="rp_input_holder py-2 px-3 rounded-2">
                <select
                  name="type"
                  className="rp_singleInput flex-grow-1"
                  value={formvalue.type}
                  onChange={handleChange}
                  disabled={!formvalue.category}>
                  <option value="">Select Type</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <span className="text-danger">{errors.type}</span>
            </div>

            <div className="rp_singleinput_holder mb-3">
              <p className="rp_label mb-2">Phrase</p>
              <p className="rp_label mb-2" style={{ fontSize: "12px", opacity: 0.6 }}>
                Use {"{variable}"} syntax. Reserved: {"{scorer}"} (goal scorer), {"{team}"} (team name). Assist players map in order of appearance: {"{assist1}"}, {"{assist2}"}, etc.
              </p>
              <div className="rp_input_holder py-2 px-3 rounded-2">
                <textarea
                  name="phrase"
                  className="rp_singleInput w-100 flex-grow-1"
                  rows="3"
                  value={formvalue.phrase}
                  onChange={handleChange}
                  placeholder="e.g. Goal scored by {scorer} assisted by {assist}"
                />
              </div>
              <span className="text-danger">{errors.phrase}</span>
            </div>

            <button
              className="orange_small_primary mt-3"
              onClick={handleSubmit}
              disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};