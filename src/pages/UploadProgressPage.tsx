import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const UploadProgressPage: React.FC = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("queued");
    const [message, setMessage] = useState("");
    const [uploaded, setUploaded] = useState(0);
    const [total, setTotal] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!taskId) return;

        const interval = setInterval(async () => {
            const res = await api.getUploadProgress(taskId);

            if (res.success) {
                setProgress(res.progress);
                setStatus(res.status);
                setMessage(res.message || "");
                setUploaded(res.uploaded ?? uploaded);
                setTotal(res.total ?? total);

                if (res.status === "completed") {
                    setDone(true);
                    clearInterval(interval);

                    setTimeout(() => navigate("/admin/processing-jobs"), 1500);
                }

                if (res.status === "failed") {
                    setDone(true);
                    clearInterval(interval);
                }
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [taskId]);

    return (
        <div className="max-w-xl mx-auto mt-20 bg-white shadow-lg rounded-2xl p-8 text-center">

            <h1 className="text-2xl font-semibold text-slate-800 mb-6">
                Uploading Audio Files…
            </h1>

            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-3">
                <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* FILE COUNT */}
            {total > 0 && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                    {uploaded} / {total} files uploaded
                </p>
            )}

            {/* MESSAGE */}
            <p className="text-sm text-slate-500 mb-4">
                {message || "Preparing upload…"}
            </p>

            {/* STATUS FEEDBACK */}
            {status === "failed" && (
                <div className="flex items-center gap-2 text-rose-600 justify-center">
                    <AlertTriangle className="w-5 h-5" />
                    Upload failed. Please retry.
                </div>
            )}

            {status === "completed" && (
                <div className="flex items-center gap-2 text-emerald-600 justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                    Upload complete!
                </div>
            )}

            {!done && (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mt-4" />
            )}
        </div>
    );
};

export default UploadProgressPage;
