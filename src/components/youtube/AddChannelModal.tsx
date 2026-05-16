import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { api } from "../../api/client";
import type { YouTubeChannel } from "../../types/youtube";
import { Btn } from "../ui/Btn";
import { Input } from "../ui/Input";

interface Props {
    open: boolean;
    onClose: () => void;
    onRegistered: (channel: YouTubeChannel) => void;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const AddChannelModal: React.FC<Props> = ({ open, onClose, onRegistered }) => {
    const [url, setUrl] = useState("");
    const [level, setLevel] = useState("");
    const [minDurationMin, setMinDurationMin] = useState("");
    const [maxDurationMin, setMaxDurationMin] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setUrl("");
        setLevel("");
        setMinDurationMin("");
        setMaxDurationMin("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!url.trim()) {
            setError("YouTube channel URL is required.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            const payload: {
                url: string;
                default_lesson_level?: string;
                min_duration_sec?: number;
                max_duration_sec?: number;
            } = { url: url.trim() };

            if (level) payload.default_lesson_level = level;

            const minVal = Number.parseFloat(minDurationMin);
            if (minDurationMin !== "" && !Number.isNaN(minVal)) {
                payload.min_duration_sec = Math.round(minVal * 60);
            }

            const maxVal = Number.parseFloat(maxDurationMin);
            if (maxDurationMin !== "" && !Number.isNaN(maxVal)) {
                payload.max_duration_sec = Math.round(maxVal * 60);
            }

            const res = await api.registerChannel(payload);
            resetForm();
            onRegistered(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to register channel.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
            <div className="bg-white rounded-2xl shadow-shell w-full max-w-lg p-6 border border-slate-100">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">Add YouTube Channel</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* FORM */}
                <div className="space-y-4 text-sm">
                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="channel-url"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
                            Channel URL *
                        </label>
                        <Input
                            id="channel-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/@TEDEd"
                            disabled={submitting}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="channel-level"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
                            Default Lesson Level
                        </label>
                        <select
                            id="channel-level"
                            className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            disabled={submitting}
                        >
                            <option value="">No default</option>
                            {LEVELS.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="channel-min-dur"
                                className="block text-xs font-medium text-slate-600 mb-1"
                            >
                                Min Duration (minutes)
                            </label>
                            <Input
                                id="channel-min-dur"
                                type="number"
                                min={0}
                                step={0.5}
                                value={minDurationMin}
                                onChange={(e) => setMinDurationMin(e.target.value)}
                                placeholder="e.g. 2"
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="channel-max-dur"
                                className="block text-xs font-medium text-slate-600 mb-1"
                            >
                                Max Duration (minutes)
                            </label>
                            <Input
                                id="channel-max-dur"
                                type="number"
                                min={0}
                                step={0.5}
                                value={maxDurationMin}
                                onChange={(e) => setMaxDurationMin(e.target.value)}
                                placeholder="e.g. 15"
                                disabled={submitting}
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-2 mt-6">
                    <Btn.Secondary onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Btn.Secondary>
                    <Btn.Primary onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Adding..." : "Add Channel"}
                    </Btn.Primary>
                </div>
            </div>
        </div>
    );
};
