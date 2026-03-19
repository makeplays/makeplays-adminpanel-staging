import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../Layouts/dashboardLayout";
import crypto from '../../config/crypto';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

var secretKey = crypto.cryptoSecretKey

export const CreditsPage = () => {

    const percentage = 60;
    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <section className="editPageContainer creditsCard">
                    <div className="cmn_modal_header d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="circleProgressStyle">
                            <CircularProgressbar value={percentage} text={`${percentage}%`} />;
                        </div>
                        <p className="cmn_modal_title">Credits</p>
                        </div>
                    </div>

                    <div className="mt-4 ">
                        <div className="rp_singleinput_holder d-flex align-items-center justify-content-between mb-3">
                            <p className="rp_label mb-2">Total</p>
                            <p className="mb-2 creditsPoints">207,380</p>
                        </div>
                        <div className="rp_singleinput_holder d-flex align-items-center justify-content-between">
                            <p className="rp_label mb-2">Remaining</p>
                            <p className="mb-2 creditsPoints">173,538</p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};