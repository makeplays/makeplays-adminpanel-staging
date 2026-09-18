import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { isEmpty } from "../../lib/isEmpty";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import {
  addAnnouncementTemplate,
  getAnnouncementCategories,
  getAnnouncementTypes,
} from "../../api/adminApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { useSport } from "../../context/sportContext";

// Categories, types and their variables come from the database, scoped to the
// active sport. They used to be a hardcoded CATEGORY_TYPE_MAP / VARIABLE_HINTS
// pair here, which mixed hockey and soccer concepts and could not be extended
// without a release — production data had already outgrown it.

const initialFormValue = { categoryId: "", typeId: "", phrase: "" };

export const AddAnnouncementTemplatePage = () => {
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const history = useHistory();
  const { sportId, sport } = useSport();

  useEffect(() => {
    if (!sportId) return;
    // Switching sport mid-form clears the selection: a category from the
    // previous sport must never be submitted against this one.
    setFormvalue(initialFormValue);
    (async () => {
      const { status, result } = await getAnnouncementCategories({ sportId });
      setCategories(status ? result ?? [] : []);
    })();
  }, [sportId]);

  useEffect(() => {
    if (!sportId || !formvalue.categoryId) {
      setTypes([]);
      return;
    }
    (async () => {
      const { status, result } = await getAnnouncementTypes({
        sportId,
        categoryId: formvalue.categoryId,
      });
      setTypes(status ? result ?? [] : []);
    })();
  }, [sportId, formvalue.categoryId]);

  const selectedCategory = categories.find((c) => c._id === formvalue.categoryId) || null;

  const handleChange = (e) => {
    setErrors({});
    const { name, value } = e.target;
    if (name === "categoryId") {
      setFormvalue({ ...formvalue, categoryId: value, typeId: "" });
    } else {
      setFormvalue({ ...formvalue, [name]: value });
    }
  };

  const validate = () => {
    let err = {};
    if (isEmpty(formvalue.categoryId)) err.category = "Category is required";
    if (isEmpty(formvalue.typeId)) err.type = "Type is required";
    if (isEmpty(formvalue.phrase)) err.phrase = "Phrase is required";
    return err;
  };

  const handleSubmit = async () => {
    try {
      const err = validate();
      if (!isEmpty(err)) { setErrors(err); return; }

      setLoading(true);
      const { status, message } = await addAnnouncementTemplate({ ...formvalue, sportId });
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
                  name="categoryId"
                  className="rp_singleInput flex-grow-1"
                  value={formvalue.categoryId}
                  onChange={handleChange}>
                  <option value="">
                    {categories.length ? "Select Category" : "No categories for this sport"}
                  </option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.label || c.name}
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
                  name="typeId"
                  className="rp_singleInput flex-grow-1"
                  value={formvalue.typeId}
                  onChange={handleChange}
                  disabled={!formvalue.categoryId}>
                  <option value="">
                    {!formvalue.categoryId
                      ? "Select a category first"
                      : types.length
                      ? "Select Type"
                      : "No types in this category"}
                  </option>
                  {types.map((t) => (
                    <option key={t._id} value={t._id}>{t.type}</option>
                  ))}
                </select>
              </div>
              <span className="text-danger">{errors.type}</span>
            </div>

            <div className="rp_singleinput_holder mb-3">
              <p className="rp_label mb-2">Phrase</p>
              <p className="rp_label mb-2" style={{ fontSize: "12px", opacity: 0.6 }}>
                Use {"{variable}"} syntax.
                {selectedCategory?.variables?.length > 0 && (
                  <>
                    {" "}
                    Available in <b>{selectedCategory.label || selectedCategory.name}</b>:{" "}
                    {selectedCategory.variables.join(", ")}
                  </>
                )}
              </p>
              <div className="rp_input_holder py-2 px-3 rounded-2">
                <textarea
                  name="phrase"
                  className="rp_singleInput w-100 flex-grow-1"
                  rows="3"
                  value={formvalue.phrase}
                  onChange={handleChange}
                  placeholder={
                    selectedCategory?.variables?.length
                      ? `e.g. ... ${selectedCategory.variables.join(" ... ")}`
                      : "e.g. Goal scored by {scorer} assisted by {assist1}"
                  }
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