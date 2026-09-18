import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import audioTag from "../assets/images/testAudio.mp3";
import key from "../config/index";
import { assetUrl } from "../lib/assetUrl";

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
          <p className="cmn_modal_title">Delete Member</p>
          <button
            className="cmn_modal_closer rounded-5"
            onClick={handleClose}>
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-3">
          <p className="dash_graymed_text">Are you sure want to delete Member</p>
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
  const audioSrc = record?.aiVoice
    ? assetUrl(record.aiVoice, `${key.IMAGE_URL}/MemberAudio/`)
    : "";


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
            {/* The member, not the file. This was the raw storage URL printed
                as a heading — three wrapped lines of signed-URL noise that told
                an admin nothing about whose voice they were about to hear, and
                pushed the player out of view. */}
            <h2 className="cmn_modal_title mb-1">
              {[record?.firstname, record?.lastname].filter(Boolean).join(" ") || "Member"}
            </h2>
            <p className="text-secondary small mb-4">
              {record?.number ? `#${record.number} · ` : ""}
              {record?.position || "AI voice"}
            </p>
            {/* The resolved URL, as a link rather than a heading. Opening it
                in a new tab separates "the clip will not play in this element"
                from "the clip is not reachable at all", which is the first
                thing to know when a preview is silent. */}
            <a
              href={audioSrc}
              target="_blank"
              rel="noreferrer"
              className="d-block text-secondary small mb-3 text-truncate"
              title={audioSrc}
            >
              Open the audio file directly
            </a>
            {audioSrc ? (
              // `src` on the element, not a child <source>, and keyed by the
              // URL. A <source> child is read once when the element mounts:
              // React swapping its src on the next member leaves the browser
              // holding the first clip, so the player shows the previous
              // member's duration and the Play button does nothing. The key
              // forces a fresh element per clip, which is the only reliable way
              // to make an <audio> pick up a new source.
              <audio
                key={audioSrc}
                controls
                preload="metadata"
                className="w-100"
                style={{ maxWidth: "100%" }}
                src={audioSrc}
              >
                Your browser does not support the audio element.
              </audio>
            ) : (
              <p className="text-secondary mb-0">
                No voice clip has been generated for this member yet.
              </p>
            )}
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
export const MembersPageModels = { DeleteModal, PreviewModal }