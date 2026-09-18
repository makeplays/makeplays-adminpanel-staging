import React, { useCallback, useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { IoIosAdd } from "react-icons/io";
import { useSport } from "../../context/sportContext";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import {
  getAnnouncementCategories,
  addAnnouncementCategory,
  updateAnnouncementCategory,
  deleteAnnouncementCategory,
  getAnnouncementTypes,
  addAnnouncementType,
  deleteAnnouncementType,
} from "../../api/adminApi";

/**
 * Master-detail management of announcement categories and their types, scoped
 * to the active sport.
 *
 * Replaces the hardcoded CATEGORY_TYPE_MAP that used to live in
 * AddAnnouncementTemplatePage.jsx. That map mixed hockey and soccer concepts
 * and could not be extended without a release — production had already
 * outgrown it (its Lineup category carries six types against the map's one).
 */
function CategoriesAndTypesTab({ canEdit }) {
  const { sportId, sport, loading: sportLoading } = useSport();

  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // add-category form
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState("");
  // variables editor for the selected category
  const [newVariable, setNewVariable] = useState("");
  const [savingVars, setSavingVars] = useState(false);

  const selected = categories.find((c) => c._id === selectedId) || null;

  const loadCategories = useCallback(
    async (keepId) => {
      if (!sportId) return;
      setLoading(true);
      const { status, result, message } = await getAnnouncementCategories({ sportId });
      setLoading(false);
      if (!status) {
        CustomToastHandler({ msg: message, type: "error" });
        return;
      }
      const list = result ?? [];
      setCategories(list);
      // keep the current selection if it still exists, else fall back to first
      setSelectedId((prev) => {
        const want = keepId ?? prev;
        return list.some((c) => c._id === want) ? want : list[0]?._id ?? null;
      });
    },
    [sportId],
  );

  const loadTypes = useCallback(async () => {
    if (!sportId || !selectedId) {
      setTypes([]);
      return;
    }
    const { status, result, message } = await getAnnouncementTypes({ sportId, categoryId: selectedId });
    if (!status) {
      CustomToastHandler({ msg: message, type: "error" });
      return;
    }
    setTypes(result ?? []);
  }, [sportId, selectedId]);

  // Refetch whenever the active sport changes — this is the reactive switching
  // requirement: no page reload, the lists just follow the switcher.
  useEffect(() => {
    setSelectedId(null);
    setCategories([]);
    setTypes([]);
    loadCategories();
  }, [sportId, loadCategories]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    const { status, message } = await addAnnouncementCategory({ sportId, name, label: name });
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      setNewCategory("");
      loadCategories();
    }
  };

  const handleDeleteCategory = async (cat) => {
    // The data layer counts dependants and refuses rather than cascading, so a
    // category with phrases behind it can never be lost to a mis-click.
    const { status, message } = await deleteAnnouncementCategory({ _id: cat._id });
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) loadCategories();
  };

  const handleAddType = async () => {
    const type = newType.trim();
    if (!type || !selectedId) return;
    const { status, message } = await addAnnouncementType({ sportId, categoryId: selectedId, type });
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      setNewType("");
      loadTypes();
    }
  };

  const handleDeleteType = async (t) => {
    const { status, message } = await deleteAnnouncementType({ _id: t._id });
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) loadTypes();
  };

  const saveVariables = async (variables) => {
    if (!selected) return;
    setSavingVars(true);
    const { status, message } = await updateAnnouncementCategory({ _id: selected._id, variables });
    setSavingVars(false);
    if (!status) {
      CustomToastHandler({ msg: message, type: "error" });
      return;
    }
    loadCategories(selected._id);
  };

  const handleAddVariable = () => {
    let v = newVariable.trim();
    if (!v) return;
    // phrases reference variables as {token}; accept either spelling
    if (!v.startsWith("{")) v = `{${v.replace(/[{}]/g, "")}}`;
    if (selected.variables.includes(v)) {
      CustomToastHandler({ msg: "That variable is already listed", type: "error" });
      return;
    }
    setNewVariable("");
    saveVariables([...selected.variables, v]);
  };

  const handleRemoveVariable = (v) => saveVariables(selected.variables.filter((x) => x !== v));

  if (sportLoading) {
    return <p className="dash_graymed_text p-4 m-0">Loading sports…</p>;
  }

  if (!sportId) {
    return (
      <p className="dash_graymed_text p-4 m-0">
        No active sport selected. Activate a sport under Sports to manage its announcement categories.
      </p>
    );
  }

  return (
    <div className="p-3">
      <p className="dash_graymed_text mb-3">
        Categories and types for <b>{sport?.name}</b>. Phrases are created against these, so add a
        category and its types before adding phrases.
      </p>

      <Row className="g-3">
        {/* ── Categories ─────────────────────────────────────────────── */}
        <Col lg={5}>
          <div className="ann_panel">
            <p className="ann_panel_head">CATEGORIES</p>

            {loading && <p className="dash_graymed_text px-3">Loading…</p>}
            {!loading && !categories.length && (
              <p className="dash_graymed_text px-3">No categories yet for {sport?.name}.</p>
            )}

            <ul className="ann_list">
              {categories.map((c) => (
                <li
                  key={c._id}
                  className={`ann_list_item ${c._id === selectedId ? "is_active" : ""}`}
                  onClick={() => setSelectedId(c._id)}
                >
                  <span className="ann_list_label">{c.label || c.name}</span>
                  {canEdit && (
                    <button
                      type="button"
                      className="ann_icon_btn"
                      title="Delete category"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(c);
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {canEdit && (
              <div className="ann_add_row">
                <input
                  className="ann_input"
                  placeholder="New category, e.g. Lineup"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <button type="button" className="ann_add_btn" onClick={handleAddCategory}>
                  <IoIosAdd size={20} />
                </button>
              </div>
            )}
          </div>

          {/* variables editor for the selected category */}
          {selected && (
            <div className="ann_panel mt-3">
              <p className="ann_panel_head">VARIABLES IN "{selected.label || selected.name}"</p>
              <p className="dash_graymed_text px-3 ann_hint">
                Offered when writing a phrase in this category, e.g. {"{player}"}.
              </p>
              <div className="ann_chip_wrap">
                {selected.variables.length === 0 && (
                  <span className="dash_graymed_text ann_hint">None yet.</span>
                )}
                {selected.variables.map((v) => (
                  <span key={v} className="ann_chip">
                    {v}
                    {canEdit && (
                      <button
                        type="button"
                        className="ann_chip_x"
                        onClick={() => handleRemoveVariable(v)}
                        disabled={savingVars}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canEdit && (
                <div className="ann_add_row">
                  <input
                    className="ann_input"
                    placeholder="{player}"
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddVariable()}
                  />
                  <button
                    type="button"
                    className="ann_add_btn"
                    onClick={handleAddVariable}
                    disabled={savingVars}
                  >
                    <IoIosAdd size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </Col>

        {/* ── Types in the selected category ─────────────────────────── */}
        <Col lg={7}>
          <div className="ann_panel">
            <p className="ann_panel_head">
              {selected ? `TYPES IN "${selected.label || selected.name}"` : "TYPES"}
            </p>

            {!selected && <p className="dash_graymed_text px-3">Select a category on the left.</p>}

            {selected && !types.length && (
              <p className="dash_graymed_text px-3">
                No types yet. Add one below, e.g. Goalie, Forwards, Defense.
              </p>
            )}

            {selected && types.length > 0 && (
              <ul className="ann_list">
                {types.map((t) => (
                  <li key={t._id} className="ann_list_item is_static">
                    <span className="ann_list_label">{t.type}</span>
                    <span className="ann_count">
                      {t.phraseCount ?? 0} phrase{(t.phraseCount ?? 0) === 1 ? "" : "s"}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        className="ann_icon_btn"
                        title="Delete type"
                        onClick={() => handleDeleteType(t)}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canEdit && selected && (
              <div className="ann_add_row">
                <input
                  className="ann_input"
                  placeholder="New type, e.g. Goalie"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                />
                <button type="button" className="ann_add_btn" onClick={handleAddType}>
                  <IoIosAdd size={20} />
                </button>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default CategoriesAndTypesTab;
