import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import { ReplyContactUs } from '../../api/adminApi'
import { isEmpty } from "../../lib/isEmpty";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import "react-quill/dist/quill.snow.css";
import ReactSummernote from "react-summernote";
import "react-summernote/dist/react-summernote.css";
import $ from "jquery";
import { Col, Row } from "react-bootstrap";
window.$ = window.jQuery = $;

export const ReplyContactUsPage = ({ record }) => {

  const initialFormValue = {
    content: ""
  };

  const history = useHistory();
  const [formvalue, setFormvalue] = useState(initialFormValue);
  const [errors, setErrors] = useState({});
  const location = useLocation();

  const replyData = location.state.record || {};

  useEffect(() => {
    if (replyData) {
      setFormvalue({
        _id: replyData?._id
      });
    }
  }, [replyData]);

  const handlechange = (e) => {
    setErrors({})
    const { name, value } = e.target;
    setFormvalue({ ...formvalue, [name]: value });
  }

  const validation = () => {
    let errors = {};
    if (isEmpty(formvalue?.content)) {
      errors.content = "Content field is required";
    }
    return errors
  }

  const handleSubmit = async () => {
    try {
      var value = validation()
      if (!isEmpty(value)) {
        setErrors(value)
        return;
      }

      let { status, loading, error, message } = await ReplyContactUs(formvalue);
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
    history.push("/contactus")
  };

  return (
    <DashboardLayout>
      <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
        <section className="editPageContainer">
          <div className="cmn_modal_header d-flex justify-content-between align-items-center mb-4">
            <p className="cmn_modal_title">Reply</p>
            <button className="backBtn" onClick={handleCloseModal}>
              Back
            </button>
          </div>

          <Row>
            <Col xl={7}>
              <div className="mt-4">

                <div className="rp_singleinput_holder mb-3">
                  <p className="rp_label mb-2">Content</p>
                  <div className="rp_input_holder py-2 px-3 rounded-2">
                    <textarea
                      name="content"
                      className="rp_singleInput w-100  flex-grow-1"
                      rows="4"
                      value={formvalue?.content}
                      onChange={(e) => { handlechange(e) }}
                      placeholder="Enter Content"
                    />
                  </div>
                  <span className="text-danger">{errors.content}</span>
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
