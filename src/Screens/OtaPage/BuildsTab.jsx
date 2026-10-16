// OTA Management → Builds: store builds (TestFlight / Play) per platform,
// newest first, each with its size and growth, changelog, and the OTA
// bundles that run on it. Builds record themselves at build time
// (apps/mobile/scripts/record-store-build.js); older ones are added here.
// Backed by deploy bundle 84 (admin_ota_build_timeline).
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import {
  addNativeBuild,
  deleteNativeBuild,
  formatBytes,
  formatChange,
  getBuildTimeline,
  updateNativeBuild,
} from "../../config/supabaseOta";

const DISTRIBUTIONS = [
  ["local", "Local only"],
  ["internal", "Play internal"],
  ["testflight", "TestFlight"],
  ["production", "Store (production)"],
];
const distLabel = (d) => (DISTRIBUTIONS.find(([v]) => v === d) || [null, d])[1];
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
const emptyAdd = (platform) => ({
  platform, versionName: "", buildNumber: "", fingerprint: "", label: "", artifactMb: "",
  artifactKind: platform === "ios" ? "ipa" : "aab", distribution: platform === "ios" ? "testflight" : "internal",
  changelog: "", builtAt: "",
});

// Bars = store-build artifact size; dots = the OTA bundles on that build.
const SizeChart = ({ builds }) => {
  const cols = [...builds].reverse().filter((b) => b.artifactBytes != null || (b.bundles || []).some((x) => x.bytes != null));
  if (cols.length === 0) return <p className="cp_hint">Sizes appear here as builds are recorded.</p>;
  const max = Math.max(
    1,
    ...cols.map((b) => b.artifactBytes || 0),
    ...cols.flatMap((b) => (b.bundles || []).map((x) => x.bytes || 0)),
  );
  const W = Math.max(320, cols.length * 70);
  const H = 180;
  const top = 18;
  const base = H - 30;
  const y = (v) => base - (v / max) * (base - top);
  const colW = W / cols.length;
  return (
    <div className="ota_chart_wrap">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Store build and bundle sizes">
        <line x1="0" x2={W} y1={base} y2={base} stroke="var(--box_border)" />
        {cols.map((b, i) => {
          const cx = i * colW + colW / 2;
          return (
            <g key={b.id}>
              {b.artifactBytes != null && (
                <>
                  <rect x={cx - 16} y={y(b.artifactBytes)} width="32" height={base - y(b.artifactBytes)} rx="3" fill="var(--static-primary1)">
                    <title>{`${b.label}: ${formatBytes(b.artifactBytes)} ${b.artifactKind || ""}`}</title>
                  </rect>
                  <text x={cx} y={y(b.artifactBytes) - 4} textAnchor="middle" fontSize="10" fill="var(--placeholder)">{formatBytes(b.artifactBytes)}</text>
                </>
              )}
              {(b.bundles || []).filter((x) => x.bytes != null).map((x, j) => (
                <circle key={x.id} cx={cx + 22 + (j % 3) * 7} cy={y(x.bytes)} r="3.5" fill={x.live ? "var(--table_green)" : "var(--placeholder)"}>
                  <title>{`Bundle …${String(x.id).slice(-8)}: ${formatBytes(x.bytes)}${x.live ? " (LIVE)" : ""}`}</title>
                </circle>
              ))}
              <text x={cx} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--white)">{b.buildNumber ?? "?"}</text>
            </g>
          );
        })}
      </svg>
      <p className="cp_hint m-0">Bars: store build artifact. Dots: OTA bundles on it (green = LIVE).</p>
    </div>
  );
};

const BuildsTab = ({ canWrite }) => {
  const history = useHistory();
  const [platform, setPlatform] = useState("ios");
  const [data, setData] = useState({ builds: [], unmatched: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});
  const [adding, setAdding] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async (p = platform) => {
    setLoading(true);
    const { status, message, result } = await getBuildTimeline(p);
    if (status) setData(result);
    else CustomToastHandler({ msg: message, type: "error" });
    setLoading(false);
  };
  useEffect(() => {
    load(platform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const saveAdd = async (e) => {
    e.preventDefault();
    if (!adding.fingerprint.trim() || !adding.buildNumber) {
      CustomToastHandler({ msg: "Enter at least the build number and the fingerprint.", type: "error" });
      return;
    }
    const { status, message } = await addNativeBuild(adding);
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      setAdding(null);
      load();
    }
  };
  const saveEdit = async () => {
    const { status, message } = await updateNativeBuild(editing.id, editing);
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      setEditing(null);
      load();
    }
  };
  const remove = async (b) => {
    const { status, message } = await deleteNativeBuild(b.id);
    CustomToastHandler({ msg: message, type: status ? "success" : "error" });
    if (status) {
      setEditing(null);
      load();
    }
  };

  const latest = data.builds[0];
  const summary = useMemo(() => {
    const sized = data.builds.filter((b) => b.artifactBytes != null);
    if (sized.length < 2) return null;
    const d = sized[0].artifactBytes - sized[sized.length - 1].artifactBytes;
    return `${formatChange(d)} from ${sized[sized.length - 1].label} to ${sized[0].label}`;
  }, [data.builds]);

  return (
    <div className="p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex gap-2">
          {[["ios", "iOS"], ["android", "Android"]].map(([p, l]) => (
            <button key={p} className={`ota_seg ${platform === p ? "is_active" : ""}`} onClick={() => setPlatform(p)}>{l}</button>
          ))}
        </div>
        {canWrite && (
          <button className="exchange_tableFileUploader table_extrabtns" onClick={() => setAdding(emptyAdd(platform))}>
            <p className="cmn_extraBtnsLabel m-0">Add a build by hand</p>
          </button>
        )}
      </div>

      <p className="cp_hint mb-3">
        Release builds record themselves (Gradle bundleRelease / assembleRelease, Xcode Archive of makeplays-release).
        {latest ? ` Latest: ${latest.label}, ${fmtDate(latest.builtAt)}.` : ""}
        {summary ? ` Size ${summary}.` : ""}
        {" "}Sizes are the build artifact (.aab / .xcarchive), not the store download size.
      </p>

      {loading ? (
        <p className="cp_hint">Loading…</p>
      ) : (
        <>
          <div className="dashboard_box rounded-3 p-3 mb-3"><SizeChart builds={data.builds} /></div>

          {data.builds.length === 0 && (
            <p className="cp_hint">No {platform === "ios" ? "iOS" : "Android"} builds recorded yet. The next release build adds itself; add older ones by hand.</p>
          )}

          <div className="d-flex flex-column gap-3">
            {data.builds.map((b) => (
              <div key={b.id} className="ota_build_card">
                <div className="d-flex flex-wrap justify-content-between gap-2">
                  <div>
                    <p className="ota_build_title">{b.label}</p>
                    <p className="cp_hint m-0">
                      {fmtDate(b.builtAt)} · <span className="ota_pill ota_pill_muted">{distLabel(b.distribution)}</span>
                      {b.recordedBy ? ` · by ${b.recordedBy}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="ota_build_size">{formatBytes(b.artifactBytes)} <span className="cp_hint">{b.artifactKind || ""}</span></p>
                    {b.sizeChange != null && (
                      <p className={`cp_hint m-0 ${b.sizeChange > 0 ? "cp_hint_warn" : "text-success"}`}>{formatChange(b.sizeChange)} vs {b.prevLabel}</p>
                    )}
                    {b.appBytes != null && <p className="cp_hint m-0">app inside: {formatBytes(b.appBytes)}</p>}
                  </div>
                </div>
                <p className="cp_hint mt-2 mb-1">
                  Fingerprint <code className="ota_code_small">{String(b.fingerprint).slice(0, 12)}</code>
                  {b.commit ? <> · commit <code className="ota_code_small">{String(b.commit).slice(0, 8)}</code></> : null}
                </p>

                <div className="d-flex gap-3 flex-wrap">
                  {b.changelog && (
                    <button className="ota_link_btn" onClick={() => setOpen((o) => ({ ...o, [b.id]: !o[b.id] }))}>
                      {open[b.id] ? "Hide changelog" : `Changelog (${b.changelog.split("\n").length})`}
                    </button>
                  )}
                  {canWrite && <button className="ota_link_btn" onClick={() => setEditing({ ...b })}>Edit</button>}
                </div>
                {open[b.id] && <pre className="ota_changelog">{b.changelog}</pre>}

                <div className="ota_build_bundles">
                  {!b.ownsBundles ? (
                    <p className="cp_hint m-0">Same native code as a newer build — its OTA bundles are listed there.</p>
                  ) : b.bundles.length === 0 ? (
                    <p className="cp_hint m-0">No OTA bundles for this build yet.</p>
                  ) : (
                    b.bundles.map((x) => (
                      <div key={x.id} className={`ota_bundle_row ${x.enabled ? "" : "is_off"}`}>
                        <span className="ota_code_small">{fmtDate(x.createdAt)}</span>
                        <code className="ota_code_small">…{String(x.id).slice(-8)}</code>
                        {x.live && <span className="ota_pill ota_pill_live">LIVE</span>}
                        {!x.enabled && <span className="ota_pill ota_pill_off">off</span>}
                        <span className="ota_code_small">{formatBytes(x.bytes)}</span>
                        {x.notesSlug ? (
                          <button className="ota_link_btn" onClick={() => history.push(`/ota/notes/edit?slug=${encodeURIComponent(x.notesSlug)}`)}>{x.notesSlug}</button>
                        ) : (
                          <span className="cp_hint m-0 ota_bundle_msg">{(x.message || "").slice(0, 70)}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.unmatched.length > 0 && (
            <div className="ota_build_card mt-3">
              <p className="ota_build_title">Bundles for unrecorded builds</p>
              <p className="cp_hint">These bundles target a fingerprint no recorded build has. Add that build so they appear under it.</p>
              {data.unmatched.map((u) => (
                <div key={u.fingerprint} className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <code className="ota_code_small">{String(u.fingerprint).slice(0, 16)}</code>
                  <span className="cp_hint m-0">{u.bundles.length} bundle{u.bundles.length === 1 ? "" : "s"}</span>
                  {canWrite && (
                    <button className="ota_link_btn" onClick={() => setAdding({ ...emptyAdd(platform), fingerprint: u.fingerprint })}>Add this build</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal show={!!adding} onHide={() => setAdding(null)} centered size="lg" className="cmn_modal">
        <Modal.Body>
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-3">
            <p className="cmn_modal_title">Add a {adding?.platform === "ios" ? "iOS" : "Android"} build</p>
            <button className="cmn_modal_closer rounded-5" onClick={() => setAdding(null)}><i className="fa-solid fa-xmark" /></button>
          </div>
          {adding && (
            <form onSubmit={saveAdd} className="d-flex flex-column gap-2">
              <div className="d-flex gap-2 flex-wrap">
                {[["versionName", "Version (1.0.5)", 140], ["buildNumber", "Build number (68)", 150], ["artifactMb", "Size in MB (optional)", 170]].map(([k, ph, w]) => (
                  <div key={k} className="rp_input_holder py-1 px-2 rounded-2">
                    <input className="rp_singleInput" style={{ width: w }} placeholder={ph} value={adding[k]} onChange={(e) => setAdding({ ...adding, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="rp_input_holder py-1 px-2 rounded-2">
                  <select className="rp_singleInput" value={adding.distribution} onChange={(e) => setAdding({ ...adding, distribution: e.target.value })}>
                    {DISTRIBUTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="rp_input_holder py-1 px-2 rounded-2">
                  <input className="rp_singleInput" type="date" value={adding.builtAt} onChange={(e) => setAdding({ ...adding, builtAt: e.target.value })} />
                </div>
              </div>
              <div className="rp_input_holder py-1 px-2 rounded-2">
                <input className="rp_singleInput w-100" placeholder="Fingerprint hash (apps/mobile/fingerprint.json at that build's commit)" value={adding.fingerprint} onChange={(e) => setAdding({ ...adding, fingerprint: e.target.value })} />
              </div>
              <div className="rp_input_holder py-1 px-2 rounded-2">
                <input className="rp_singleInput w-100" placeholder="Label (optional — defaults to e.g. iOS 1.0.5 (68))" value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} />
              </div>
              <div className="rp_input_holder py-1 px-2 rounded-2">
                <textarea className="rp_singleInput w-100" rows="4" placeholder="Changelog (optional)" value={adding.changelog} onChange={(e) => setAdding({ ...adding, changelog: e.target.value })} />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="secondary_btn" onClick={() => setAdding(null)}>Cancel</button>
                <button type="submit" className="orange_small_primary">Add build</button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={!!editing} onHide={() => setEditing(null)} centered size="lg" className="cmn_modal">
        <Modal.Body>
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-3">
            <p className="cmn_modal_title">Edit {editing?.label}</p>
            <button className="cmn_modal_closer rounded-5" onClick={() => setEditing(null)}><i className="fa-solid fa-xmark" /></button>
          </div>
          {editing && (
            <div className="d-flex flex-column gap-2">
              <div className="d-flex gap-2 flex-wrap">
                <div className="rp_input_holder py-1 px-2 rounded-2 flex-grow-1">
                  <input className="rp_singleInput w-100" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
                </div>
                <div className="rp_input_holder py-1 px-2 rounded-2">
                  <select className="rp_singleInput" value={editing.distribution} onChange={(e) => setEditing({ ...editing, distribution: e.target.value })}>
                    {DISTRIBUTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="rp_input_holder py-1 px-2 rounded-2">
                <textarea className="rp_singleInput w-100" rows="8" value={editing.changelog || ""} onChange={(e) => setEditing({ ...editing, changelog: e.target.value })} />
              </div>
              <div className="d-flex justify-content-between gap-2">
                <button className="ota_link_btn text-danger" onClick={() => remove(editing)}>Remove this build</button>
                <div className="d-flex gap-2">
                  <button className="secondary_btn" onClick={() => setEditing(null)}>Cancel</button>
                  <button className="orange_small_primary" onClick={saveEdit}>Save</button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BuildsTab;
