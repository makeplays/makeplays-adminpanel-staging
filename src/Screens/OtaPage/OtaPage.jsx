// OTA Management: release notes (What's New), the deployed bundles with a
// kill switch and roll back, the native build registry, and the audit log.
//
// Bundles come from hot-updater's table through admin_ota_* functions only
// (migration 20261014000001 / deploy bundle 82). Switching a bundle off is
// not instant mid-session: devices on it move to the previous bundle — or
// the store build's own code — on their next launch.
import React, { useEffect, useMemo, useState } from "react";
import { Col, Container, Modal, Row } from "react-bootstrap";
import ReactDatatable from "@ashvin27/react-datatable";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { IoIosAdd } from "react-icons/io";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import {
  copyText,
  formatBytes,
  formatChange,
  listAuditLog,
  listBundles,
  listReleaseNotes,
  rollbackToBundle,
  setBundleEnabled,
  setReleaseNotePublished,
} from "../../config/supabaseOta";
import DeployCommandsModal from "./DeployCommandsModal";
import NotificationsTab from "./NotificationsTab";
import BuildsTab from "./BuildsTab";

const TABS = [
  { key: "notes", label: "Release Notes" },
  { key: "bundles", label: "Bundles" },
  { key: "builds", label: "Builds" },
  { key: "notifications", label: "Notifications" },
  { key: "audit", label: "Audit Log" },
];

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const short = (id) => (id ? String(id).slice(-8) : "—");
const tableLang = (filter, empty) => ({
  no_data_text: empty,
  language: {
    length_menu: "Show _MENU_ result per page",
    filter,
    info: "Showing _START_ to _END_ of _TOTAL_ records",
    pagination: { first: "First", previous: "Previous", next: "Next", last: "Last" },
  },
  show_length_menu: false,
  show_filter: true,
  show_pagination: true,
  show_info: false,
});

const OtaPage = () => {
  const history = useHistory();
  const location = useLocation();
  const user = useSelector((state) => state.isRun);
  const canWrite = user?.role === "superadmin" && user?.accessLevel === "Admin";
  const [tab, setTab] = useState(new URLSearchParams(location.search).get("tab") || "notes");

  const go = (key) => {
    setTab(key);
    history.replace(`/ota?tab=${key}`);
  };

  // ── release notes ────────────────────────────────────────────────────────
  const [notes, setNotes] = useState([]);
  const [commandsFor, setCommandsFor] = useState(null);
  const loadNotes = async () => {
    const { status, message, result } = await listReleaseNotes();
    if (status) setNotes(result);
    else CustomToastHandler({ msg: message, type: "error" });
  };
  const togglePublished = async (n) => {
    const { status, message } = await setReleaseNotePublished(n.slug, !n.published);
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) loadNotes();
  };

  const linkBadge = (links, p) => {
    const l = links?.[p];
    if (!l) return <span className="ota_pill ota_pill_muted">{p === "ios" ? "iOS" : "Android"} —</span>;
    return (
      <span className={`ota_pill ${l.enabled ? "ota_pill_ok" : "ota_pill_off"}`}>
        {p === "ios" ? "iOS" : "Android"} ✓{l.bundles > 1 ? ` ×${l.bundles}` : ""}
      </span>
    );
  };

  const noteColumns = [
    {
      key: "title", text: "Release", sortable: true,
      cell: (n) => (
        <div>
          <p className="m-0 fw-semibold">{n.title}</p>
          <code className="ota_code_small">{n.slug}</code>
        </div>
      ),
    },
    { key: "mode", text: "Shown as", sortable: true, cell: (n) => <span className={`ota_pill ota_mode_${n.mode}`}>{n.mode}</span> },
    {
      key: "published", text: "Published", sortable: true,
      cell: (n) => <span className={n.published ? "text-success" : "cp_hint_warn"}>{n.published ? "Published" : "Draft"}</span>,
    },
    {
      key: "links", text: "Deployed to", sortable: false,
      cell: (n) =>
        n.links?.android || n.links?.ios ? (
          <div className="d-flex gap-1 flex-wrap">{linkBadge(n.links, "android")}{linkBadge(n.links, "ios")}</div>
        ) : (
          <span className="cp_hint m-0">Awaiting deploy</span>
        ),
    },
    { key: "updatedAt", text: "Updated", sortable: true, cell: (n) => <span>{fmt(n.updatedAt)}</span> },
    {
      key: "action", text: "Action", sortable: false,
      cell: (n) => (
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <button className="ota_link_btn" onClick={() => history.push(`/ota/notes/edit?slug=${encodeURIComponent(n.slug)}`)}>
            {canWrite ? "Edit" : "View"}
          </button>
          <button className="ota_link_btn" onClick={() => setCommandsFor(n)}>Commands</button>
          {canWrite && (
            <button className="ota_link_btn" onClick={() => togglePublished(n)}>{n.published ? "Unpublish" : "Publish"}</button>
          )}
        </div>
      ),
    },
  ];

  // ── bundles ──────────────────────────────────────────────────────────────
  const [bundles, setBundles] = useState([]);
  const [bundleCount, setBundleCount] = useState(0);
  const [filters, setFilters] = useState({ platform: "", channel: "", enabled: "" });
  const [paging, setPaging] = useState({ page: 1, limit: 10, search: "" });
  const loadBundles = async (p = paging, f = filters) => {
    const { status, message, result, count } = await listBundles({ ...f, ...p });
    if (status) {
      setBundles(result);
      setBundleCount(count);
    } else CustomToastHandler({ msg: message, type: "error" });
  };
  const setFilter = (key) => (e) => {
    const next = { ...filters, [key]: e.target.value };
    setFilters(next);
    const p = { ...paging, page: 1 };
    setPaging(p);
    loadBundles(p, next);
  };

  // Confirm dialog for switching a bundle on/off or rolling back to it.
  const [confirm, setConfirm] = useState(null); // { kind: 'disable'|'enable'|'rollback', bundle }
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const openConfirm = (kind, bundle) => {
    setConfirm({ kind, bundle });
    setReason("");
    setTyped("");
  };
  const lastOne = confirm?.kind === "disable" && confirm.bundle.isLive && !confirm.bundle.fallbackId;
  const runConfirm = async () => {
    if (!confirm || busy) return;
    if (lastOne && typed !== "ROLLBACK") return;
    setBusy(true);
    try {
      const { bundle, kind } = confirm;
      const res = kind === "rollback"
        ? await rollbackToBundle(bundle.id, reason)
        : await setBundleEnabled(bundle.id, kind === "enable", reason);
      CustomToastHandler({ msg: res.message, type: res.status ? "success" : "error" });
      if (res.status) {
        setConfirm(null);
        loadBundles();
        loadNotes();
      }
    } finally {
      setBusy(false);
    }
  };

  const bundleColumns = [
    {
      key: "createdAt", text: "Deployed", sortable: false,
      cell: (b) => (
        <div>
          <p className="m-0">{fmt(b.createdAt)}</p>
          <code className="ota_code_small" title={b.id}>…{short(b.id)}</code>
        </div>
      ),
    },
    {
      key: "platform", text: "Platform", sortable: false,
      cell: (b) => (
        <div className="d-flex gap-1 align-items-center flex-wrap">
          <span className="ota_pill ota_pill_muted">{b.platform === "ios" ? "iOS" : "Android"}</span>
          {b.channel !== "production" && <span className="ota_pill ota_pill_muted">{b.channel}</span>}
          {b.isLive && <span className="ota_pill ota_pill_live">LIVE</span>}
        </div>
      ),
    },
    {
      key: "nativeLabel", text: "Store build", sortable: false,
      cell: (b) =>
        b.nativeLabel ? (
          <span>{b.nativeLabel}</span>
        ) : (
          <span className="cp_hint_warn" title={b.fingerprint || b.targetAppVersion}>
            Unknown build ⚠ <code className="ota_code_small">{(b.fingerprint || b.targetAppVersion || "").slice(0, 10)}</code>
          </span>
        ),
    },
    {
      key: "notesSlug", text: "Release / message", sortable: false,
      cell: (b) =>
        b.notesSlug ? (
          <button className="ota_link_btn" onClick={() => history.push(`/ota/notes/edit?slug=${encodeURIComponent(b.notesSlug)}`)}>
            {b.notesSlug}
          </button>
        ) : (
          <span className="cp_hint m-0" title={b.message}>{(b.message || "—").slice(0, 60)}</span>
        ),
    },
    { key: "gitCommit", text: "Commit", sortable: false, cell: (b) => <code className="ota_code_small">{b.gitCommit ? b.gitCommit.slice(0, 8) : "—"}</code> },
    {
      key: "bundleBytes", text: "Size", sortable: false,
      cell: (b) => (
        <div>
          <p className="m-0">{formatBytes(b.bundleBytes)}</p>
          {b.sizeChange != null && <span className={`cp_hint m-0 ${b.sizeChange > 0 ? "cp_hint_warn" : ""}`}>{formatChange(b.sizeChange)}</span>}
        </div>
      ),
    },
    { key: "forceUpdate", text: "Force", sortable: false, cell: (b) => <span>{b.forceUpdate ? "Yes" : "No"}</span> },
    {
      key: "enabled", text: "Enabled", sortable: false,
      cell: (b) => (
        <label className={`ota_switch ${canWrite ? "" : "is_readonly"}`} title={canWrite ? "" : "Only an active superadmin can change this"}>
          <input type="checkbox" checked={b.enabled} disabled={!canWrite} onChange={() => openConfirm(b.enabled ? "disable" : "enable", b)} />
          <span className="ota_switch_track"><span className="ota_switch_thumb" /></span>
        </label>
      ),
    },
    {
      key: "action", text: "Action", sortable: false,
      cell: (b) => (
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          {canWrite && !b.isLive && <button className="ota_link_btn" onClick={() => openConfirm("rollback", b)}>Roll back to here</button>}
          <button className="ota_link_btn" onClick={async () => CustomToastHandler({ msg: (await copyText(b.id)) ? "Bundle id copied." : "Couldn't copy." })}>Copy id</button>
        </div>
      ),
    },
  ];

  // ── audit ────────────────────────────────────────────────────────────────
  const [audit, setAudit] = useState([]);
  const loadAudit = async () => {
    const { status, result } = await listAuditLog();
    if (status) setAudit(result);
  };
  const auditColumns = [
    { key: "at", text: "When", sortable: true, cell: (r) => <span>{fmt(r.at)}</span> },
    { key: "actor", text: "Who", sortable: true, cell: (r) => <span>{r.actor}</span> },
    { key: "action", text: "What", sortable: true, cell: (r) => <code className="ota_code_small">{r.action}</code> },
    { key: "target", text: "On", sortable: true, cell: (r) => <code className="ota_code_small">{r.target}</code> },
    { key: "reason", text: "Reason", sortable: false, cell: (r) => <span>{r.reason || "—"}</span> },
  ];

  useEffect(() => {
    if (tab === "notes") loadNotes();
    if (tab === "bundles") loadBundles();
    if (tab === "audit") loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const confirmText = useMemo(() => {
    if (!confirm) return "";
    const b = confirm.bundle;
    const back = b.fallbackId ? `the previous bundle (…${short(b.fallbackId)})` : "the store build's own code";
    if (confirm.kind === "disable") {
      return b.isLive
        ? `Devices on this bundle go back to ${back} on their next launch. It does not stop the app mid-session.`
        : "This bundle is not the live one, so devices are unaffected unless newer bundles are switched off later.";
    }
    if (confirm.kind === "enable") return "Devices whose newest matching bundle this becomes will download it and run it on the following launch.";
    return "Every newer bundle for the same platform, channel and store build is switched off, and this one becomes live. Devices move to it on their next launch.";
  }, [confirm]);

  return (
    <Container fluid className="common_bg position-relative">
      <div className="liner"></div>
      <Row>
        <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
          <Sidebar />
        </Col>
        <Col xl={10} lg={12}>
          <Header title={"OTA Management"} />
          <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
            <div className="exchange_table_holder dashboard_box rounded-3 mt-4 tabletop">
              <div className="ann_tabs px-3 pt-3 flex-wrap">
                {TABS.map((t) => (
                  <button key={t.key} className={`ann_tab ${tab === t.key ? "is_active" : ""}`} onClick={() => go(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "notes" && (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <p className="cp_hint m-0">
                      Each release's What's New. Save and publish the notes first, then deploy with the commands — the app looks up its notes once, on the first launch of the new bundle.
                    </p>
                    {canWrite && (
                      <button className="exchange_tableFileUploader table_extrabtns" onClick={() => history.push("/ota/notes/add")}>
                        <IoIosAdd className="me-1" />
                        <p className="cmn_extraBtnsLabel m-0">New release notes</p>
                      </button>
                    )}
                  </div>
                  <ReactDatatable config={{ page_size: 10, ...tableLang("Search releases...", "No release notes yet.") }} records={notes} columns={noteColumns} />
                </div>
              )}

              {tab === "bundles" && (
                <div className="p-3">
                  <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
                    {[
                      ["platform", [["", "All platforms"], ["android", "Android"], ["ios", "iOS"]]],
                      ["enabled", [["", "On and off"], ["true", "On only"], ["false", "Off only"]]],
                    ].map(([key, opts]) => (
                      <div key={key} className="rp_input_holder py-1 px-2 rounded-2">
                        <select className="rp_singleInput" value={filters[key]} onChange={setFilter(key)}>
                          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    ))}
                    <div className="rp_input_holder py-1 px-2 rounded-2">
                      <input className="rp_singleInput" style={{ width: 130 }} placeholder="Channel" value={filters.channel} onChange={setFilter("channel")} />
                    </div>
                    <p className="cp_hint m-0">LIVE = what devices on that store build get now.</p>
                  </div>
                  <ReactDatatable
                    config={{ page_size: paging.limit, ...tableLang("Search id, message, commit...", "No bundles deployed yet.") }}
                    records={bundles}
                    columns={bundleColumns}
                    dynamic={true}
                    total_record={bundleCount}
                    onChange={(e) => {
                      const p = { page: e.page_number, limit: e.page_size, search: e.filter_value || "" };
                      setPaging(p);
                      loadBundles(p);
                    }}
                  />
                </div>
              )}

              {tab === "builds" && <BuildsTab canWrite={canWrite} />}

              {tab === "notifications" && <NotificationsTab canWrite={canWrite} />}

              {tab === "audit" && (
                <div className="p-3">
                  <p className="cp_hint mb-2">Every change made here, newest first (last 200).</p>
                  <ReactDatatable config={{ page_size: 20, ...tableLang("Search the log...", "Nothing changed yet.") }} records={audit} columns={auditColumns} />
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <DeployCommandsModal show={!!commandsFor} note={commandsFor} onHide={() => setCommandsFor(null)} />

      <Modal show={!!confirm} onHide={() => setConfirm(null)} centered className="cmn_modal">
        <Modal.Body>
          <div className="cmn_modal_header d-flex justify-content-between align-items-center">
            <p className="cmn_modal_title">
              {confirm?.kind === "disable" ? "Switch this bundle off?" : confirm?.kind === "enable" ? "Switch this bundle on?" : "Roll back to this bundle?"}
            </p>
            <button className="cmn_modal_closer rounded-5" onClick={() => setConfirm(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          {confirm && (
            <div className="mt-3">
              <p className="rp_label mb-2">
                {confirm.bundle.platform === "ios" ? "iOS" : "Android"} · {confirm.bundle.nativeLabel || "unknown store build"} · …{short(confirm.bundle.id)}
              </p>
              <p className="cp_hint">{confirmText}</p>
              {lastOne && (
                <p className="cp_hint cp_hint_warn">
                  This is the last enabled bundle for this store build — devices fall back to the code shipped in the store build itself. Type ROLLBACK to confirm.
                </p>
              )}
              <div className="rp_input_holder py-2 px-3 rounded-2 mt-2">
                <input className="rp_singleInput w-100" placeholder="Reason (kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              {lastOne && (
                <div className="rp_input_holder py-2 px-3 rounded-2 mt-2">
                  <input className="rp_singleInput w-100" placeholder="Type ROLLBACK" value={typed} onChange={(e) => setTyped(e.target.value)} />
                </div>
              )}
              <div className="d-flex justify-content-center gap-2">
                <button className="secondary_btn mt-4" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="orange_small_primary mt-4" onClick={runConfirm} disabled={busy || (lastOne && typed !== "ROLLBACK")}>
                  {busy ? "Working…" : confirm.kind === "disable" ? "Switch off" : confirm.kind === "enable" ? "Switch on" : "Roll back"}
                </button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default OtaPage;
