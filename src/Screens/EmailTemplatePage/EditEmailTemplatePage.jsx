import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import { EditTemplate } from '../../api/adminApi'
import { CustomToastHandler } from "../../hooks/useCustomToast";
import "react-quill/dist/quill.snow.css";
import ReactSummernote from "react-summernote";
import "react-summernote/dist/react-summernote.css";
import $ from "jquery";
import { Col, Row } from "react-bootstrap";
window.$ = window.jQuery = $;

const initialFormValue = {
  subject: "",
  content: ""
};

export const EditEmailTemplatePage = ({ record }) => {
  const history = useHistory();
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [errors, setErrors] = useState({});
  const location = useLocation();
  const emailData = location.state.record || {};

  useEffect(() => {
    if (emailData) {
      setFormvalue({
        _id: emailData?._id,
        subject: emailData.subject,
        content: emailData.content
      });
    }
  }, [emailData]);


  const handleChange = (e) => {
    try {
      let Formvalue = { ...formvalue }
      if (e.target && e.target.name == 'subject') {
        const { name, value } = e.target;
        Formvalue = { ...formvalue, [name]: value };
      }

      setFormvalue(Formvalue)
    } catch (err) {
      console.log("handleChange__err", err);
    }
  };
  const handleEdit = (e) => {
    try {
      setFormvalue((prevFormValue) => ({
        ...prevFormValue,
        content: e,
      }));
    } catch (err) {
      console.log("handleEdit__err", err);
    }
  }

  const handleSubmit = async () => {
    try {
      let { status, loading, error, message } = await EditTemplate(formvalue);
      if (status) {
        CustomToastHandler({ msg: message })
        setErrors({})
        handleCloseModal()
      } else {
        if (error) {
          setErrors(error);
        } else if (message) {
          CustomToastHandler({ msg: message, type: "error" })
        }
      }
    } catch (err) {
      console.log("handleSubmit__err", err);
    }
  };

  const handleCloseModal = () => {
    setFormvalue(initialFormValue);
    setErrors({});
    history.push("/email-template")
  };

  return (
    <DashboardLayout>
      <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
        <section className="editPageContainer">
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-4">
            <p className="cmn_modal_title">Edit Eamil</p>
            <button className="backBtn" onClick={handleCloseModal}>
              Back
            </button>
          </div>

          <Row>
            <Col xl={7}>
              <div className="mt-4">
                <div className="rp_singleinput_holder mb-3">
                  <p className="rp_label mb-2">Subject</p>
                  <div className="rp_input_holder rounded-2 py-2 px-3 d-flex justify-content-start align-items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter Subject"
                      className="rp_singleInput flex-grow-1"
                      name="subject"
                      value={formvalue?.subject}
                      onChange={(e) => { handleChange(e) }}
                    />
                  </div>
                </div>


                <div className="rp_singleinput_holder mb-3">
                  <p className="rp_label mb-2">Content</p>

                  <div className="custom_reactSummerNote">
                    <ReactSummernote

                      value={formvalue?.content}
                      name="content"
                      options={{
                        height: 250,
                        dialogsInBody: true,
                        toolbar: [
                          //   ["style", ["style"]],
                          ["font", ["bold", "underline", "clear"]],
                          //   ["fontname", ["fontname"]],
                          ["para", ["ul", "ol", "paragraph"]],
                          // ["table", ["table"]],
                          // ["insert", ["link", "picture", "video"]],
                          ["view", ["codeview"]],
                        ],
                      }}
                      onChange={handleEdit}
                    />
                  </div>
                </div>
                <button className="orange_small_primary mt-3"
                  onClick={() => handleSubmit()}
                >Submit </button>
              </div>
            </Col>
          </Row>

        </section>
      </div>
    </DashboardLayout>
  );
};