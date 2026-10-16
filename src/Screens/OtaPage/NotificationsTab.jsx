// OTA Management → Notifications: who gets the release email for each new
// OTA bundle, the on/off switch, a test send, and the log of what was sent.
// Backed by deploy bundle 83 and the ota-deployed Edge Function.
import React, { useEffect, useState } from "react";
import ReactDatatable from "@ashvin27/react-datatable";
import { supabase } from "../../config/supabase";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import {
  addRecipient,
  deleteRecipient,
  getNotificationStatus,
  listNotifications,
  listRecipients,
  sendTestEmail,
  setEmailsEnabled,
  updateRecipient,
} from "../../config/supabaseOta";

const fmt = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const tableConfig = (filter, empty, size = 10) => ({
  page_size: size,
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

const PLATFORMS = [
  ["ios", "iOS"],
  ["android", "Android"],
];

const NotificationsTab = ({ canWrite }) => {
  const [status, setStatus] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [log, setLog] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", platforms: ["ios", "android"] });
  const [busy, setBusy] = useState(false);
  const [myEmail, setMyEmail] = useState("");

  const load = async () => {
    const [s, r, l] = await Promise.all([getNotificationStatus(), listRecipients(), listNotifications()]);
    if (s.status) setStatus(s.result);
    else CustomToastHandler({ msg: s.message, type: "error" });
    if (r.status) setRecipients(r.result);
    if (l.status) setLog(l.result);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setMyEmail(data?.user?.email || ""));
  }, []);

  const toggleEmails = async () => {
    const { status: ok, message } = await setEmailsEnabled(!status?.emails_enabled);
    CustomToastHandler({ msg: message, type: ok ? "success" : "error" });
    if (ok) load();
  };

  const add = async (e) => {
    e.preventDefault();
    if (!form.platforms.length) {
      CustomToastHandler({ msg: "Pick at least one platform.", type: "error" });
      return;
    }
    const { status: ok, message } = await addRecipient(form);
    CustomToastHandler({ msg: message, type: ok ? "success" : "error" });
    if (ok) {
      setForm({ email: "", name: "", platforms: ["ios", "android"] });
      load();
    }
  };

  const patch = async (r, change) => {
    const { status: ok, message } = await updateRecipient(r._id, change);
    if (!ok) CustomToastHandler({ msg: message, type: "error" });
    load();
  };

  const test = async (to) => {
    if (busy) return;
    setBusy(true);
    try {
      const { status: ok, message } = await sendTestEmail(to);
      CustomToastHandler({ msg: message, type: ok ? "success" : "error" });
    } finally {
      setBusy(false);
    }
  };

  const recipientColumns = [
    { key: "email", text: "Email", sortable: true, cell: (r) => <span>{r.email}</span> },
    { key: "name", text: "Name", sortable: true, cell: (r) => <span>{r.name || "—"}</span> },
    {
      key: "platforms", text: "Platforms", sortable: false,
      cell: (r) => (
        <div className="d-flex gap-3 justify-content-center">
          {PLATFORMS.map(([p, label]) => (
            <label key={p} className="d-flex gap-1 align-items-center m-0">
              <input
                type="checkbox"
                checked={r.platforms.includes(p)}
                disabled={!canWrite || (r.platforms.length === 1 && r.platforms.includes(p))}
                onChange={(e) => patch(r, { platforms: e.target.checked ? [...r.platforms, p] : r.platforms.filter((x) => x !== p) })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      key: "active", text: "Active", sortable: true,
      cell: (r) => (
        <label className={`ota_switch ${canWrite ? "" : "is_readonly"}`}>
          <input type="checkbox" checked={r.active} disabled={!canWrite} onChange={() => patch(r, { active: !r.active })} />
          <span className="ota_switch_track"><span className="ota_switch_thumb" /></span>
        </label>
      ),
    },
    ...(canWrite
      ? [{
          key: "action", text: "Action", sortable: false,
          cell: (r) => (
            <div className="d-flex gap-2 justify-content-center">
              <button className="ota_link_btn" disabled={busy} onClick={() => test(r.email)}>Send test</button>
              <button className="ota_link_btn text-danger" onClick={async () => {
                const { status: ok, message } = await deleteRecipient(r._id);
                CustomToastHandler({ msg: message, type: ok ? "success" : "error" });
                if (ok) load();
              }}>Remove</button>
            </div>
          ),
        }]
      : []),
  ];

  const logColumns = [
    { key: "startedAt", text: "When", sortable: true, cell: (n) => <span>{fmt(n.startedAt)}</span> },
    { key: "bundleId", text: "Bundle", sortable: false, cell: (n) => <code className="ota_code_small">…{String(n.bundleId).slice(-8)}</code> },
    {
      key: "sent", text: "Sent", sortable: true,
      cell: (n) => (
        <span className={n.sentAt && n.sent === n.recipients ? "text-success" : "cp_hint_warn"}>
          {n.sentAt ? `${n.sent} / ${n.recipients}` : "in progress / failed"}
        </span>
      ),
    },
    {
      key: "errors", text: "Problems", sortable: false,
      cell: (n) => <span className="cp_hint m-0">{n.errors.length ? n.errors.map((e) => `${e.to}: ${e.error}`).join("; ") : "—"}</span>,
    },
  ];

  return (
    <div className="p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <p className="rp_label mb-1">Release emails</p>
          <p className="cp_hint m-0">
            Every new OTA bundle emails the active recipients for its platform: what shipped, the store build, size, who deployed it.
          </p>
          {status && (
            <p className="cp_hint m-0 mt-1">
              <span className={status.emails_enabled ? "text-success" : "cp_hint_warn"}>{status.emails_enabled ? "On" : "Off"}</span>
              {" · "}
              <span className={status.service_key_present ? "" : "cp_hint_warn"}>
                {status.service_key_present ? "Vault service key present" : "Vault service_role_key missing — no emails will be sent"}
              </span>
              {" · "}
              <span className={status.template_present ? "" : "cp_hint_warn"}>
                {status.template_present ? "Template ready" : "Template OTA_BUNDLE_DEPLOYED missing"}
              </span>
              {" · "}
              {status.active_recipients} active recipient{status.active_recipients === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {canWrite && status && (
          <div className="d-flex gap-2 flex-wrap">
            <label className="ota_switch">
              <input type="checkbox" checked={!!status.emails_enabled} onChange={toggleEmails} />
              <span className="ota_switch_track"><span className="ota_switch_thumb" /></span>
              <span className="rp_label">{status.emails_enabled ? "Emails on" : "Emails off"}</span>
            </label>
            <button className="secondary_btn" disabled={busy || !myEmail} onClick={() => test(myEmail)}>Test to me</button>
            <button className="orange_small_primary" disabled={busy || !recipients.some((r) => r.active)} onClick={() => test(null)}>Test to everyone</button>
          </div>
        )}
      </div>

      {canWrite && (
        <form className="d-flex flex-wrap gap-2 mb-3 align-items-center" onSubmit={add}>
          <div className="rp_input_holder py-1 px-2 rounded-2 flex-grow-1">
            <input className="rp_singleInput w-100" type="email" required placeholder="dev@makeplays.ca" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="rp_input_holder py-1 px-2 rounded-2">
            <input className="rp_singleInput" style={{ width: 160 }} placeholder="Name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          {PLATFORMS.map(([p, label]) => (
            <label key={p} className="d-flex gap-1 align-items-center m-0 rp_label">
              <input
                type="checkbox"
                checked={form.platforms.includes(p)}
                onChange={(e) => setForm({ ...form, platforms: e.target.checked ? [...form.platforms, p] : form.platforms.filter((x) => x !== p) })}
              />
              {label}
            </label>
          ))}
          <button type="submit" className="orange_small_primary">Add</button>
        </form>
      )}

      <ReactDatatable config={tableConfig("Search recipients...", "No recipients yet — add the people who should hear about releases.")} records={recipients} columns={recipientColumns} />

      <p className="rp_label mt-4 mb-2">Recent sends</p>
      <ReactDatatable config={tableConfig("Search sends...", "Nothing sent yet. Deploy a bundle or send a test.", 10)} records={log} columns={logColumns} />
      <p className="cp_hint">Test sends use the newest bundle and are not logged here.</p>
    </div>
  );
};

export default NotificationsTab;
