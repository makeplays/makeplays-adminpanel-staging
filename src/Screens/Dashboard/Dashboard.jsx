import React, { useEffect, useState, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import { RiFileList2Fill } from "react-icons/ri";
import { FaUserCog } from "react-icons/fa";
import { MdSettingsSystemDaydream } from "react-icons/md";
import { useHistory } from "react-router-dom";
import { listCounts } from '../../api/adminApi'

const Dashboard = () => {

    const history = useHistory();
    const [count, setCount] = useState(0);

    const handleUserCard = () => {
        history.push("/users")
    }

    const handleTeamsCard = () => {
        history.push("/teams")
    }

    useEffect(() => {
        getCounts();
    }, []);

    const getCounts = async () => {
        try {
            let { status, loading, error, message, result, count } = await listCounts();
            if (status) {
                setCount(result)
            } else {
                if (error) {
                } else if (message) {
                }
            }
        } catch (err) {
            console.log("getCounts__err", err);
        }
    };

    return (
        <>
            <Container fluid className="common_bg position-relative">
                <div className="liner"></div>
                <Row>
                    <Col xl={2} lg={0} className="p-0 d-none d-xl-block">
                        <Sidebar />
                    </Col>
                    <Col xl={10} lg={12}>
                        <Header title={"Team"} />
                        <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                            <div className='cardbox'>
                                <div className='dashboard_boxall'>
                                    <div
                                        className={`d-flex align-items-center justify-content-between dashboard_innerbox`}
                                        onClick={handleUserCard}
                                    >
                                        <FaUserCog fontSize={46} color="white" />
                                        <div>
                                            <p className="dash_title">Users</p>
                                            <p className="dash_no">{count?.UserCount}</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`d-flex align-items-center justify-content-between dashboard_innerbox`}
                                        onClick={handleTeamsCard}
                                    >
                                        <MdSettingsSystemDaydream fontSize={46} color="white" />
                                        <div>
                                            <p className="dash_title">Teams</p>
                                            <p className="dash_no">{count?.TeamCount}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Dashboard;