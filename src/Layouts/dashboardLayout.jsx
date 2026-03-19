import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";

export const DashboardLayout = ({ children }) => {
    return (
        <Container fluid className="common_bg position-relative">
            <div className="liner"></div>
            <Row>
                <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
                    <Sidebar />
                </Col>
                <Col xl={10} lg={12}>
                    <Header title={"Team"} />
                    <div>
                        {children}
                    </div>
                </Col>
            </Row>
        </Container>
    );
};