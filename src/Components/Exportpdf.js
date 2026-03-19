import React from 'react';
import jsPDF from "jspdf";
import "jspdf-autotable";


const Exportpdf = ({ pdfData, fileName }) => {

  const exportPDF = () => {
    const unit = "pt";
    const size = "A2"; // Use A1, A2, A3 or A4
    const orientation = "landscape"; // portrait or landscape
    const marginLeft = 40;
    const doc = new jsPDF(orientation, unit, size);
    doc.setFontSize(15);
    // const tit
    var keys = Object.keys(pdfData[0]);
    const headers = [keys];
    var values = pdfData.map(item =>
      Object.values(item)
    )
    let content = {
      startY: 50,
      head: headers,
      body: values
    };
    doc.text(fileName, marginLeft, 10);
    doc.autoTable(content);
    doc.save(fileName)
  }

  return (
    <div>
      <button className='btn bottom_btn' onClick={() => exportPDF()}>Generate PDF</button>
    </div>
  );

}

export default Exportpdf