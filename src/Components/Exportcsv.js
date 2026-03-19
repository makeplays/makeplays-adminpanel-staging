import React from 'react';
import { CSVLink } from "react-csv";

const Exportcsv=({csvData,fileName})=>{
    
    var header=csvData.map((item)=>
    [JSON.stringify(item)]
    )

const csvReport = {
    data: csvData,
    filename: fileName
  };


  return (
    <div classname="App">
    <CSVLink className='btn bottom_btn_csv' {...csvReport} >Generate CSV</CSVLink>
    </div>
  );


}
export default Exportcsv;