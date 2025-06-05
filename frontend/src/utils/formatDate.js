import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
dayjs.extend(buddhistEra);

// ฟอร์แมตวันที่ (แสดง พ.ศ.)
export const formatDate = (dateString, dateFormat = "DD MMMM BBBB") => {
    if (!dateString) return "";
    dayjs.locale("th");
    const d = dayjs(dateString);
    // แทนที่ YYYY ด้วยปี พ.ศ.
    return d.format(dateFormat);
};

// ฟอร์แมตวันที่+เวลา (แสดง พ.ศ.)
export const formatDateTime = (dateString, dateTimeFormat = "DD MMMM BBBB | HH:mm น.") => {
    if (!dateString) return "";
    dayjs.locale("th");
    const d = dayjs(dateString);
    return d.format(dateTimeFormat);
};

// ฟอร์แมตเพื่อ input type="date" (ISO date ไม่ต้องแปลง พ.ศ.)
export const formatDateForInput = (dateString, dateFormat = "BBBB-MM-DD") => {
    if (!dateString) return "";
    return dayjs(dateString).format(dateFormat);
};

// แปลงเป็น ISO string ส่งให้ server (ไม่ต้องแปลง พ.ศ.)
export const formatDateToServer = (dateString) => {
    if (!dateString) return "";
    return dayjs(dateString).toISOString();
};

// รับค่า year ค.ศ. แล้วคืนเป็น พ.ศ.
export const formatYearToThai = (yearString) => {
    const year = Number(yearString);
    return isNaN(year) ? "" : (year + 543).toString();
};
