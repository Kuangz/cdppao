import { useState } from "react";
import { changeBinStatus } from "../api/garbageBin";
import { useMessageApi } from "../contexts/MessageContext";

function getBinStatusPayload(values, currentBin) {
    const base = {
        action: values.status,
        status:
            values.status === "broken"
                ? "broken"
                : values.status === "lost"
                    ? "lost"
                    : values.status === "replaced"
                        ? "active"
                        : values.status === "removed"
                            ? "removed"
                            : "active",
        note: values.note || "",
    };

    if (values.images?.length) {
        base.images = values.images;
    }
    // ส่ง serial/size เฉพาะ replaced
    if (values.status === "replaced") {
        base.serial = values.serial;
        base.size = Number(values.size);
    }

    return base;
}


export default function useChangeBinStatus() {
    const [loading, setLoading] = useState(false);
    const messageApi = useMessageApi();

    const handleChangeStatus = async ({
        pointId,
        values,
        currentBin,
        onPointUpdated,
        onRefresh,
        onDone,
    }) => {
        setLoading(true);
        try {
            const payload = getBinStatusPayload(values, currentBin);
            const res = await changeBinStatus(pointId, payload);

            messageApi.success("เปลี่ยนสถานะสำเร็จ");

            if (onPointUpdated && res?.data) onPointUpdated(res.data);
            if (onRefresh) onRefresh();
            if (onDone) onDone();

            return res?.data;
        } catch (err) {
            messageApi.error("เปลี่ยนสถานะไม่สำเร็จ");
        } finally {
            setLoading(false); // <<--- ปิด loading ทั้งสำเร็จ/พลาด
        }
    };

    return [handleChangeStatus, loading];
}
