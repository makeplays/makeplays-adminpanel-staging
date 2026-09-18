import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import { AddTemplate } from "../../api/adminApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import "react-quill/dist/quill.snow.css";
import ReactSummernote from "react-summernote";
import "react-summernote/dist/react-summernote.css";
import $ from "jquery";
import { Col, Row } from "react-bootstrap";
import AppliesToPills from "../../Components/AppliesToPills";
import { useSport } from "../../context/sportContext";
window.$ = window.jQuery = $;

const initialFormValue = { identifier: "", subject: "", content: "" };

/**
 * Create an email template.
 *
 * The identifier is the contract with the codebase: developers call
 * send-email with { identifier }, so it is typed here and then referenced from
 * code. Restricted to [A-Za-z0-9_] for that reason — a string with spaces or
 * punctuation is awkward to pass around and easy to mistype.
 *
 * Scope is chosen first (see AppliesToPills): "All Sports" stores sport_id
 * null and is what every sport falls back to; a sport-scoped row overrides it
 * for that sport only. send-email resolves most-specific-wins at send time.
 */
export const AddEmailTemplatePage = () => {
  const history = useHistory();
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [allSports, setAllSports] = useState(false);
  const [loading, setLoading] = useState(false);
  const { sportId, sport } = useSport();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormvalue((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (content) => {
    setFormvalue((prev) => ({ ...prev, content }));
  };

  const handleClose = () => {
    setFormvalue(initialFormValue);
    history.push("/email-template");
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { status, message } = await AddTemplate({
        ...formvalue,
        allSports,
        sportId,
      });
      if (status) {
        CustomToastHandler({ msg: message });
        handleClose();
      } else {
        CustomToastHandler({ msg: message, type: "error" });
      }
    } catch (err) {
      console.log("AddEmailTemplate__err", err);
      CustomToastHandler({ msg: "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
        <section className="editPageContainer">
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-4">
            <p className="cmn_modal_title">Add Email Template</p>
            <button className="backBtn" onClick={handleClose}>
              Back
            </button>
          </div>

          <Row>
            <Col xl={7}>
              <div className="mt-4">
                {/* Scope first: it frames everything below, and asking after the
                    body is written risks the admin redoing the work. */}
                <AppliesToPills allSports={allSports} onChange={setAllSports} />

                <div className="rp_singleinput_holder mb-3">
                  <p className="rp_label mb-2">Identifier</p>
                  <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SEND_TOURNAMENT_REMINDER"
                      className="rp_singleInput flex-grow-1"
                      name="identifier"
                      value={formvalue.identifier}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="applies_hint">
                    Referenced from code as{" "}
                    <code>{`send-email { identifier: "${formvalue.identifier || "YOUR_IDENTIFIER"}" }`}</code>.
                    Letters, numbers and underscores only.
                    {!allSports && sport?.name
                      ? ` Reuse an existing identifier to override it for ${sport.name}.`
                      : ""}
                  </p>
                </div>

                <div className="rp_singleinput_holder mb-3">
                  <p className="rp_label mb-2">Subject</p>
                  <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter Subject"
                      className="rp_singleInput flex-grow-1"
                      name="subject"
                      value={formvalue.subject}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="rp_singleinput_holder mb-3">
                  <p className="rp_label mb-2">Content</p>
                  <p className="applies_hint mb-2">
                    Placeholders use <code>##KEY##</code> — that is the only syntax
                    send-email substitutes. Anything else reaches the reader as
                    literal text.
                  </p>
                  <div className="custom_reactSummerNote">
                    <ReactSummernote
                      value={formvalue.content}
                      name="content"
                      options={{
                        height: 250,
                        dialogsInBody: true,
                        toolbar: [
                          ["font", ["bold", "underline", "clear"]],
                          ["para", ["ul", "ol", "paragraph"]],
                          ["view", ["codeview"]],
                        ],
                      }}
                      onChange={handleEdit}
                    />
                  </div>
                </div>

                <button
                  className="orange_small_primary mt-3"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Submit"}
                </button>
              </div>
            </Col>
          </Row>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AddEmailTemplatePage;
