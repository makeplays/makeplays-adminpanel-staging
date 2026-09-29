import React, { useEffect, useState } from "react";
import { listHelpFeedback } from "../../api/adminApi";

// "Which answers are failing?" — the reason the Help Centre records a Yes/No
// under every article. Built-in answers (from the app's catalog) can be
// replaced from this panel by adding an FAQ with the exact same question; rows
// that already came from here are edited directly.
const HelpFeedbackPanel = ({ onReplace }) => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await listHelpFeedback();
      if (res?.status) {
        setRows(res.result || []);
      } else {
        // The view does not exist until 20260928000001_help_centre.sql is
        // applied; say so instead of showing an empty table.
        setError(res?.message || "Could not load help feedback.");
        setRows([]);
      }
    })();
  }, []);

  const failing = (rows || []).filter((r) => r.notHelpful > 0).slice(0, 8);

  return (
    <div className="help_feedback_panel mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <p className="cmn_modal_title m-0">Answers people said did not help</p>
        {rows && <small className="text-muted">{rows.length} answers voted on</small>}
      </div>
      {error && <p className="text-danger small m-0">{error}</p>}
      {!error && rows && failing.length === 0 && (
        <p className="text-muted small m-0">No "No" votes yet. Votes come from the Yes/No under every Help Centre article in the app.</p>
      )}
      {failing.length > 0 && (
        <div className="table-responsive">
          <table className="table table-sm align-middle m-0">
            <thead>
              <tr>
                <th>Question</th>
                <th className="text-center">Helped</th>
                <th className="text-center">Did not help</th>
                <th className="text-center">Helpful</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {failing.map((r) => (
                <tr key={r.topicId}>
                  <td>{r.question || r.topicId}</td>
                  <td className="text-center">{r.helpful}</td>
                  <td className="text-center text-danger fw-semibold">{r.notHelpful}</td>
                  <td className="text-center">{r.helpfulPct}%</td>
                  <td><span className={`scope_badge ${r.isAdminRow ? "is_sport" : ""}`}>{r.isAdminRow ? "This panel" : "Built into app"}</span></td>
                  <td className="text-end">
                    {!r.isAdminRow && onReplace && (
                      <button className="cmn_plain_btn text-primary small" onClick={() => onReplace(r.question)}>
                        Write a better answer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HelpFeedbackPanel;
