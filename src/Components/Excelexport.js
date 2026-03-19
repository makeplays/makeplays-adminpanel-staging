import * as filesaver from 'file-saver';
import XLSX from 'sheetjs-style';
import { RiExportFill } from 'react-icons/ri';

const Exportexcel = ({ excelData, fileName }) => {

    const fileType = 'appliction/vnd.openxmlfoemates-officedocument.spreadsheetml.sheet;charser=UTF-8';
    const fileExtension = '.xlsx';

    const exportexcel = async () => {
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = { Sheets: { "data": ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        filesaver.saveAs(data, fileName + fileExtension);
    }

    return (
        <>
            <button variant='contained' onClick={(e) => exportexcel(fileName)} color="primary" className='btn table_extrabtns p-0' style={{ cursor: "pointer", fontSize: 14 }}>
                <RiExportFill size={20} />
            </button>
        </>
    )

}

export default Exportexcel;
