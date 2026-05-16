import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { YouTubeIngestionBatch } from "../../types/youtube";

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (batch: YouTubeIngestionBatch) => void;
    selectedVideoIds: number[];
    channelDefaults?: {
        defaultLessonLevel?: string | null;
        defaultCategoryId?: number | null;
    };
}

export const CreateBatchModal: React.FC<Props> = ({
    open,
    onClose,
    onCreated,
    selectedVideoIds,
    channelDefaults,
}) => {
    const navigate = useNavigate();

    const [batchName, setBatchName] = useState("");
    const [lessonLevel, setLessonLevel] = useState(channelDefaults?.defaultLessonLevel ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setBatchName("");
        setLessonLevel(channelDefaults?.defaultLessonLevel ?? "");
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setError(null);
        setSubmitting(true);
        try {
            const batch = await api.createBatch({
                video_pk_ids: selectedVideoIds,
                name: batchName.trim() || undefined,
                default_lesson_level: lessonLevel || undefined,
                default_category_id: channelDefaults?.defaultCategoryId ?? undefined,
            });
            onCreated(batch);
            handleClose();
            navigate(`/admin/youtube/batches/${batch.id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create batch.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Queue Videos for Ingestion
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4 text-sm">
                    {/* VIDEO COUNT INFO */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700">
                        <span className="font-semibold text-slate-900">
                            {selectedVideoIds.length}
                        </span>{" "}
                        video{selectedVideoIds.length !== 1 ? "s" : ""} selected for ingestion
                    </div>

                    {/* BATCH NAME */}
                    <div>
                        <label
                            htmlFor="batch-name"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
                            Batch name <span className="text-slate-400">(optional)</span>
                        </label>
                        <input
                            id="batch-name"
                            type="text"
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                            placeholder="e.g. May 2026 batch"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>

                    {/* DEFAULT LESSON LEVEL */}
                    <div>
                        <label
                            htmlFor="batch-lesson-level"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
                            Default lesson level <span className="text-slate-400">(optional)</span>
                        </label>
                        <select
                            id="batch-lesson-level"
                            value={lessonLevel}
                            onChange={(e) => setLessonLevel(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">— None —</option>
                            {LEVEL_OPTIONS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    {lvl}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}

                {/* FOOTER */}
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || selectedVideoIds.length === 0}
                        className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-50"
                    >
                        {submitting
                            ? "Creating..."
                            : `Queue ${selectedVideoIds.length} video${selectedVideoIds.length !== 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
