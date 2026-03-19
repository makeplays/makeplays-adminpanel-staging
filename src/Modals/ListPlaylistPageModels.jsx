import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import audioTag from "../assets/images/testAudio.mp3";
import key from "../config/index";

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
          <p className="cmn_modal_title">Delete Playlist</p>
          <button
            className="cmn_modal_closer rounded-5"
            onClick={handleClose}>
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-3">
          <p className="dash_graymed_text">Are you sure want to delete Playlist</p>
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

const PreviewModal = ({ show, handleClose, record }) => {
  const audioSrc = record?.audio
    ? `${key.IMAGE_URL}/PlayList/${record.audio}`
    : "";

  const getMimeType = (url) => {
    if (!url) return '';
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'aac':
        return 'audio/aac';
      case 'flac':
        return 'audio/flac';
      default:
        return 'audio/mpeg'; // default fallback
    }
  };

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
          <p className="cmn_modal_title">Preview</p>
          <button className="cmn_modal_closer rounded-5" onClick={handleClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-4">
          <div className="previewModal">
            <h2 className="cmn_modal_title mb-4">{record?.audio}</h2>
            <audio controls>
              <source src={audioSrc} type={getMimeType(audioSrc)} />
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className="d-flex justify-content-center">
            <button className="orange_small_primary mt-3" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export const ListPlaylistModels = { DeleteModal, PreviewModal }