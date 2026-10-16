// Write or edit a release's What's New. Add: /ota/notes/add. Edit:
// /ota/notes/edit?slug=… (a query param, so a page reload keeps working).
//
// The slug is never typed: the database makes it from today's date and the
// title (admin_ota_create_release_note) and it cannot change once a bundle
// carries it. Saving opens the deploy commands.
import React, { useEffect, useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import {
  MAX_ITEMS,
  OTA_MODES,
  createReleaseNote,
  getReleaseNote,
  updateReleaseNote,
} from "../../config/supabaseOta";
import { FEATHER_ICONS, FeatherIcon } from "./featherIcons";
import NotesPreview from "./NotesPreview";
import DeployCommandsModal from "./DeployCommandsModal";

const emptyForm = {
  mode: "sheet",
  title: "",
  subtitle: "",
  imageUrl: "",
  items: [{ icon: "zap", title: "", body: "" }],
  ctaLabel: "Got it",
  published: true,
};

// What the slug will look like; the saved one comes back from the database
// (which adds -2, -3… if today already has the same title).
const slugPreview = (title) => {
  const day = new Date().toISOString().slice(0, 10);
  const base = String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64).replace(/-+$/, "");
  return `${day}-${base || "release"}`;
};

const OtaNoteFormPage = () => {
  const history = useHistory();
  const location = useLocation();
  const editSlug = new URLSearchParams(location.search).get("slug");
  const user = useSelector((state) => state.isRun);
  const canWrite = user?.role === "superadmin" && user?.accessLevel === "Admin";

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!!editSlug);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [pickerFor, setPickerFor] = useState(null);
  const [saved, setSaved] = useState(null); // note to show deploy commands for

  useEffect(() => {
    if (!editSlug) return;
    (async () => {
      const { status, message, result } = await getReleaseNote(editSlug);
      if (status) {
        setForm({
          ...result,
          items: result.items.length ? result.items.map((it) => ({ icon: it.icon || "check", title: it.title || "", body: it.body || "" })) : emptyForm.items,
        });
      } else {
        CustomToastHandler({ msg: message, type: "error" });
        history.push("/ota");
      }
      setLoading(false);
    })();
  }, [editSlug, history]);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const setItem = (i, key, value) =>
    setForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [key]: value } : it)) }));
  const addItem = () =>
    setForm((f) => (f.items.length >= MAX_ITEMS ? f : { ...f, items: [...f.items, { icon: "check", title: "", body: "" }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const moveItem = (i, d) =>
    setForm((f) => {
      const j = i + d;
      if (j < 0 || j >= f.items.length) return f;
      const items = [...f.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...f, items };
    });

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Give the release a title.";
    if (form.imageUrl.trim() && !/^https:\/\//i.test(form.imageUrl.trim())) next.imageUrl = "Use an https link — the app ignores anything else.";
    const filled = form.items.filter((it) => it.title.trim());
    if ((form.mode === "sheet" || form.mode === "required") && !filled.length && !form.subtitle.trim()) {
      next.items = "Add at least one item (or a subtitle) — an empty sheet shows as a banner instead.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !canWrite || !validate()) return;
    setSaving(true);
    try {
      if (editSlug) {
        const { status, message } = await updateReleaseNote(editSlug, form);
        CustomToastHandler({ msg: message, type: status ? "success" : "error" });
        if (status) history.push("/ota");
      } else {
        const { status, message, result: slug } = await createReleaseNote(form);
        CustomToastHandler({ msg: message, type: status ? "success" : "error" });
        if (status) setSaved({ slug, mode: form.mode, published: form.published });
      }
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => form, [form]);

  return (
    <Container fluid className="common_bg position-relative">
      <div className="liner"></div>
      <Row>
        <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
          <Sidebar />
        </Col>
        <Col xl={10} lg={12}>
          <Header title={editSlug ? "Edit release notes" : "New release notes"} />
          <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
            {loading ? (
              <div className="dashboard_box rounded-3 mt-4 p-4"><p className="cp_hint">Loading…</p></div>
            ) : (
              <Row className="mt-4 g-4">
                <Col xxl={7} lg={12}>
                  <form onSubmit={handleSubmit} className="dashboard_box rounded-3 p-4">
                    {!canWrite && (
                      <p className="cp_hint cp_hint_warn mb-3">Read only — only an active superadmin can change OTA releases.</p>
                    )}

                    <div className="rp_singleinput_holder mb-4">
                      <p className="rp_label mb-2">How it's shown</p>
                      <div className="ota_modes">
                        {OTA_MODES.map((m) => (
                          <button
                            type="button"
                            key={m.value}
                            className={`ota_mode ${form.mode === m.value ? "is_active" : ""}`}
                            onClick={() => set("mode")(m.value)}
                            disabled={!canWrite}
                          >
                            <span className="ota_mode_label">{m.label}</span>
                            <span className="ota_mode_hint">{m.hint}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Title</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input className="rp_singleInput w-100" maxLength={80} placeholder="What's new" value={form.title} onChange={set("title")} disabled={!canWrite} />
                      </div>
                      {errors.title ? <p className="cp_hint text-danger">{errors.title}</p> : (
                        <p className="cp_hint">
                          Release key: <code>{editSlug || slugPreview(form.title)}</code>
                          {editSlug ? " (fixed once saved)" : " — made for you when you save"}
                        </p>
                      )}
                    </div>

                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Subtitle</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input className="rp_singleInput w-100" maxLength={200} placeholder="Music now follows your sport" value={form.subtitle} onChange={set("subtitle")} disabled={!canWrite} />
                      </div>
                      <p className="cp_hint">Optional. The banner shows this line.</p>
                    </div>

                    <div className="rp_singleinput_holder mb-3">
                      <p className="rp_label mb-2">Header image link</p>
                      <div className="rp_input_holder py-2 px-3 rounded-2">
                        <input className="rp_singleInput w-100" placeholder="https://…" value={form.imageUrl} onChange={set("imageUrl")} disabled={!canWrite} />
                      </div>
                      {errors.imageUrl ? <p className="cp_hint text-danger">{errors.imageUrl}</p> : <p className="cp_hint">Optional, 16:9 works best. Sheet modes only.</p>}
                    </div>

                    <div className="rp_singleinput_holder mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="rp_label m-0">What's in this update ({form.items.length}/{MAX_ITEMS})</p>
                        {canWrite && form.items.length < MAX_ITEMS && (
                          <button type="button" className="ota_link_btn" onClick={addItem}>+ Add item</button>
                        )}
                      </div>
                      {form.items.map((it, i) => (
                        <div key={i} className="ota_item_row">
                          <div className="position-relative">
                            <button type="button" className="ota_icon_btn" onClick={() => setPickerFor(pickerFor === i ? null : i)} disabled={!canWrite} title={it.icon}>
                              <FeatherIcon name={it.icon} size={18} />
                            </button>
                            {pickerFor === i && (
                              <div className="ota_icon_grid">
                                {Object.keys(FEATHER_ICONS).map((name) => (
                                  <button type="button" key={name} title={name} className={`ota_icon_cell ${it.icon === name ? "is_active" : ""}`}
                                    onClick={() => { setItem(i, "icon", name); setPickerFor(null); }}>
                                    <FeatherIcon name={name} size={16} />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-grow-1 d-flex flex-column gap-2">
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                              <input className="rp_singleInput w-100" maxLength={120} placeholder="Feature title" value={it.title} onChange={(e) => setItem(i, "title", e.target.value)} disabled={!canWrite} />
                            </div>
                            <div className="rp_input_holder py-2 px-3 rounded-2">
                              <input className="rp_singleInput w-100" maxLength={400} placeholder="One sentence about it (optional)" value={it.body} onChange={(e) => setItem(i, "body", e.target.value)} disabled={!canWrite} />
                            </div>
                          </div>
                          {canWrite && (
                            <div className="d-flex flex-column gap-1">
                              <button type="button" className="ota_link_btn" onClick={() => moveItem(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                              <button type="button" className="ota_link_btn" onClick={() => moveItem(i, 1)} disabled={i === form.items.length - 1} aria-label="Move down">↓</button>
                              <button type="button" className="ota_link_btn text-danger" onClick={() => removeItem(i)} aria-label="Remove item">✕</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {errors.items && <p className="cp_hint text-danger">{errors.items}</p>}
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="rp_singleinput_holder mb-3">
                          <p className="rp_label mb-2">Button label</p>
                          <div className="rp_input_holder py-2 px-3 rounded-2">
                            <input className="rp_singleInput w-100" maxLength={30} value={form.ctaLabel} onChange={set("ctaLabel")} disabled={!canWrite} />
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="rp_singleinput_holder mb-3">
                          <p className="rp_label mb-2">Published</p>
                          <label className="ota_switch">
                            <input type="checkbox" checked={form.published} onChange={set("published")} disabled={!canWrite} />
                            <span className="ota_switch_track"><span className="ota_switch_thumb" /></span>
                            <span className="rp_label">{form.published ? "Published" : "Draft"}</span>
                          </label>
                          <p className="cp_hint">Publish BEFORE deploying the bundle.</p>
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 mt-2">
                      <button type="button" className="secondary_btn" onClick={() => history.push("/ota")}>Cancel</button>
                      {canWrite && (
                        <button type="submit" className="orange_small_primary" disabled={saving}>
                          {saving ? "Saving…" : editSlug ? "Save changes" : "Save & get deploy commands"}
                        </button>
                      )}
                    </div>
                  </form>
                </Col>
                <Col xxl={5} lg={12}>
                  <div className="dashboard_box rounded-3 p-4">
                    <NotesPreview notes={preview} />
                  </div>
                </Col>
              </Row>
            )}
          </div>
        </Col>
      </Row>
      <DeployCommandsModal show={!!saved} note={saved} onHide={() => { setSaved(null); history.push("/ota"); }} />
    </Container>
  );
};

export default OtaNoteFormPage;
