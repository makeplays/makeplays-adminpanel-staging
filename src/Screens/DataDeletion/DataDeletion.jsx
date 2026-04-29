
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Col, Container, NavLink, Row } from "react-bootstrap";

const DataDeletion = () => {

    return (
        <>
            <Container fluid className="common_bg position-relative">
                <Row>
                    <Col lg={12}>
                        <div className="common_page_scroller mt-3 mt-sm-5 px-5">
                            <>
                                <div className="main-div account-deletion-container text-white">
                                    <h2 className="data-deletion-title text-center">How to Delete Your Account in the Make Plays Sports DJ App</h2>

                                    <p className="mt-4">
                                        At <strong>Make Plays Sports DJ</strong>, we respect your privacy and provide users with the option to delete their account and associated data at any time. Please follow the steps below to request account deletion through the app:
                                    </p>

                                    <ol className="listing mt-4">
                                        <li>open the <strong>Make Plays Sports DJ</strong> app on your device using the account you wish to delete.</li>
                                        <li className="mt-2">On the dashboard or home screen, tap the <strong>Profile </strong> icon located in the bottom tab navigation.</li>
                                        <li className="mt-2">The Profile screen will appear. Locate and tap the <strong>Delete Account </strong> option.</li>
                                        <li className="mt-2">Tap <strong>"OK</strong> or <strong>"Confirm"</strong>to proceed. Your account will be scheduled for deletion.</li>
                                        <li className="mt-2">Tap the <strong>"OK" or "Confirm"</strong> button to proceed. Your account and all related data will be permanently deleted from our servers.</li>
                                    </ol>

                                    <div className="note mt-4">
                                        Once confirmed, your account will enter a 30-day cooling period. During this time, your account will remain inactive and you may be able to cancel the deletion request by logging back in. After the 30-day period ends, your account and all related data will be permanently deleted from our servers.
                                        <div className="mt-1"><strong>Note:</strong> After the cooling period is completed, account deletion is permanent. Your all profile data will be permanently erased and cannot be recovered.</div>
                                    </div>
                                </div>
                            </>
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default DataDeletion;