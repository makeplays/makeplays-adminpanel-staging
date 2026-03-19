import React, { Component } from "react";
import { Link } from "react-router-dom/cjs/react-router-dom";
const NotFound = () => {
    return (
        <div className="noDataFoundPart" >
            <div className="row">
                <div className="col s12 center-align">
                    <h1>404</h1>
                    <h3>
                        No Data Found !
                    </h3>
                    <Link className="table_extrabtns w-50 text-center d-flex justify-content-center mt-5" to="/teams">Home</Link>
                </div>
            </div>
        </div>
    );
}
export default NotFound;
