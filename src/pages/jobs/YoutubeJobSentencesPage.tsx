import React, { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import type { YoutubeJobOutletContext } from "./YoutubeJobPage";

const formatSeconds = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
};

const YoutubeJobSentencesPage: React.FC = () => {
    const { job, sentences, setSentences, readOnly, setError, setJob } =
        useOutletContext<YoutubeJobOutletContext>();

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const hasInvalidTimes = sentences.some((s) => s.end <= s.start);
        if (hasInvalidTimes) {
            setError("End time must be greater than start time for every sentence.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await api.updateAudioProcessingSentences(job.id, sentences);
            setJob((prev) => (prev ? { ...prev, sentences } : prev));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save sentences.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Sentences ({sentences.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Edit sentence text and timing for this YouTube alignment job.
                        </p>
                    </div>
                    <Btn.Primary onClick={handleSave} disabled={saving || readOnly}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </Btn.Primary>
                </div>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {sentences.map((sentence, index) => {
                        const duration = sentence.end - sentence.start;

                        return (
                            <div
                                key={`${sentence.start}-${index}`}
                                className="border rounded-xl p-3 space-y-2 border-slate-200 bg-slate-50"
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-900">
                                        Sentence {index + 1}
                                    </span>
                                    <span className="text-slate-500">
                                        {formatSeconds(sentence.start)} → {formatSeconds(sentence.end)} •{" "}
                                        {duration.toFixed(2)}s
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <label className="flex items-center gap-1 text-slate-500">
                                        Start
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={sentence.start}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setSentences((prev) => {
                                                    const next = [...prev];
                                                    next[index] = { ...next[index], start: value };
                                                    return next;
                                                });
                                            }}
                                            disabled={readOnly}
                                            className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </label>

                                    <label className="flex items-center gap-1 text-slate-500">
                                        End
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={sentence.end}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setSentences((prev) => {
                                                    const next = [...prev];
                                                    next[index] = { ...next[index], end: value };
                                                    return next;
                                                });
                                            }}
                                            disabled={readOnly}
                                            className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </label>
                                </div>

                                <textarea
                                    value={sentence.text}
                                    onChange={(e) =>
                                        setSentences((prev) => {
                                            const next = [...prev];
                                            next[index] = { ...next[index], text: e.target.value };
                                            return next;
                                        })
                                    }
                                    rows={2}
                                    disabled={readOnly}
                                    className="w-full border border-slate-200 rounded-xl p-2 text-sm"
                                />
                            </div>
                        );
                    })}

                    {sentences.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            No sentences available yet. If the job is still processing, try refreshing.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YoutubeJobSentencesPage;
