import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

const ViewModal = ({ show, handleClose, editData }) => {

  const [listDatas, setListData] = useState('')

  useEffect(() => {
    setListData(editData)
  }, [editData])

  return (
    <Modal centered className="cmn_modal" show={show} onHide={handleClose} backdrop="static" keyboard={false}>
      <Modal.Body>
        <div className="cmn_modal_header d-flex justify-content-between align-items-center">
          <p className="cmn_modal_title">View User</p>
          <button className="cmn_modal_closer rounded-5" onClick={handleClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-4">
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Firstname</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="teamName"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.firstname ? listDatas.firstname : "--"}
                readOnly
              />
            </div>
          </div>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Lastname</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="teamName"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.lastname ? listDatas.lastname : "--"}
                readOnly
              />
            </div>
          </div>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Email</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="teamName"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.email ? listDatas?.email : "--"}
                readOnly
              />
            </div>
          </div>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">User Type</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="teamName"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.userType ? listDatas?.userType : "--"}
                readOnly
              />
            </div>
          </div>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">PhoneNumber</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="phoneNumber"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.phoneNumber ? listDatas?.phoneNumber : "--"}
                readOnly
              />
            </div>
          </div>
          <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Address</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="address"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.address ? listDatas.address : "--"}
                readOnly
              />
            </div>
          </div>
          {/* <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">City</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="city"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.city ? listDatas.city : "--"}
                readOnly
              />
            </div>
          </div> */}
          {/* <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Country</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="country"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.country ? listDatas.country : "--"}
                readOnly
              />
            </div>
          </div> */}
          {/* <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">Province</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="province"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.province ? listDatas.province : "--"}
                readOnly
              />
            </div>
          </div> */}
          {/* <div className="rp_singleinput_holder mb-3">
            <p className="rp_label mb-2">PostalCode</p>
            <div className="rp_input_holder rounded-2 py-2 px-3 d-flex align-items-center">
              <input
                type="text"
                name="postalCode"
                className="rp_singleInput flex-grow-1"
                value={listDatas?.postalCode ? listDatas.postalCode : "--"}
                readOnly
              />
            </div>
          </div> */}
        </div>
      </Modal.Body>
    </Modal>
  );
};

const DeleteModal = ({ show, handleClose, }) => {
  const deleteUser = async () => {

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
          <p className="cmn_modal_title">Delete User</p>
          <button
            className="cmn_modal_closer rounded-5"
            onClick={handleClose}>
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-3">
          <p className="dash_graymed_text">Are you sure want to delete these User</p>
          <div className="d-flex justify-content-center gap-2">
            <button
              className="secondary_btn mt-5 w-25"
              onClick={() => {
                handleClose();
              }}>
              Cancel
            </button>
            <button
              className="orange_small_primary mt-5 w-25"
              onClick={() => {
                deleteUser();
                handleClose();
              }}>
              Done
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export const UserPageModels = { ViewModal, DeleteModal }