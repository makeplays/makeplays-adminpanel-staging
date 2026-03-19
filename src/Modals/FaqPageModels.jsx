import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

const DeleteModal = ({ show, handleClose, onConfirm }) => {

  return (
    <Modal
      centered
      className="cmn_modal"
      show={show}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}>
      <Modal.Body>
        <div className="cmn_modal_header d-flex justify-content-between align-items-center">
          <p className="cmn_modal_title">Delete FAQ</p>
          <button
            className="cmn_modal_closer rounded-5"
            onClick={handleClose}>
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-3">
          <p className="dash_graymed_text">Are you sure you want to delete this FAQ?</p>
          <div className="d-flex justify-content-center gap-2">
            <button
              className="secondary_btn mt-5 w-25"
              onClick={handleClose}

            >
              Cancel
            </button>
            <button
              className="orange_small_primary mt-5 w-25"
              onClick={onConfirm}

            >
              Done
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export const FaqPageModels = { DeleteModal };