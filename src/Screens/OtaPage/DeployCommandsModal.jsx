// The exact deploy commands for a release's notes, ready to copy. The notes
// are already saved (and should be published) before anyone runs these:
// the app looks its notes up once, on the first launch the bundle runs.
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { copyText, deployCommands, isProductionProject } from "../../config/supabaseOta";

const DeployCommandsModal = ({ show, onHide, note }) => {
  const [force, setForce] = useState(false);
  const [channel, setChannel] = useState("production");
  if (!note) return null;
  const cmds = deployCommands({ slug: note.slug, force: note.mode === "required" && force, channel });
  const both = `${cmds.android} && ${cmds.ios}`;

  const copy = async (text, what) => {
    const ok = await copyText(text);
    CustomToastHandler({
      msg: ok ? `${what} copied.` : "Couldn't copy — select the text and copy it by hand.",
      type: ok ? "success" : "error",
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="cmn_modal">
      <Modal.Body>
        <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-3">
          <p className="cmn_modal_title">Deploy commands</p>
          <button className="cmn_modal_closer rounded-5" onClick={onHide}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {!note.published && (
          <p className="cp_hint cp_hint_warn mb-3">
            These notes are not published. Publish them BEFORE deploying — a device that
            asks while they're unpublished never asks again.
          </p>
        )}

        <p className="cp_hint mb-3">
          Run from <code>apps/mobile</code>, after committing.{" "}
          {isProductionProject()
            ? "This panel is on production, so the commands use the guarded npm run deploy:ota."
            : "This panel is on the development project, which deploy:ota refuses by design — so these call hot-updater directly."}
        </p>

        {["android", "ios"].map((p) => (
          <div key={p} className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">{p === "ios" ? "iOS" : "Android"}</p>
            <div className="ota_cmd">
              <code className="ota_cmd_text">{cmds[p]}</code>
              <button className="ota_cmd_copy" onClick={() => copy(cmds[p], p === "ios" ? "iOS command" : "Android command")}>
                Copy
              </button>
            </div>
          </div>
        ))}

        <div className="d-flex flex-wrap gap-4 align-items-center mb-3">
          {note.mode === "required" && (
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="ota_force" checked={force} onChange={(e) => setForce(e.target.checked)} />
              <label className="rp_label form-check-label" htmlFor="ota_force">Add -f (force update)</label>
            </div>
          )}
          <div className="d-flex align-items-center gap-2">
            <span className="rp_label">Channel</span>
            <div className="rp_input_holder py-1 px-2 rounded-2">
              <input
                className="rp_singleInput"
                style={{ width: 140 }}
                value={channel}
                onChange={(e) => setChannel(e.target.value.trim().toLowerCase())}
              />
            </div>
          </div>
        </div>
        {note.mode === "required" && force && (
          <p className="cp_hint mb-3">
            -f marks the bundle as critical. It does not make it apply sooner: updates still
            apply on the next launch. The Required notes are what make users acknowledge it.
          </p>
        )}

        <div className="d-flex justify-content-end gap-2">
          <button className="secondary_btn" onClick={onHide}>Close</button>
          <button className="orange_small_primary" onClick={() => copy(both, "Both commands")}>
            Copy both
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeployCommandsModal;
