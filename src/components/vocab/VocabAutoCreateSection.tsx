import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import type { VocabJob, VocabJobItem } from "../../types/vocabJob";

interface Props {
    show: boolean;
    onClose: () => void;
}

const VocabAutoCreateSection: React.FC<Props> = ({ show, onClose }) => {
    const [inputWords, setInputWords] = useState("");
    const [jobId, setJobId] = useState<number | null>(null);
    const [job, setJob] = useState<VocabJob | null>(null);
    const [loading, setLoading] = useState(false);

    // Submit words
    const submitWords = async () => {
        const words = inputWords.split("\n").map(w => w.trim()).filter(Boolean);
        if (words.length === 0) return;

        setLoading(true);

        try {
            const res = await api.autoCreateVocab({ words });
            if (res.success) {
                setJobId(res.data);
                setJob(null);
            }
        } catch (e) {
            console.error(e);
        }

        setLoading(false);
    };

    // Poll job status
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await api.getVocabJob(jobId);
                if (res.success) {
                    const jobData = res.data;
                    setJob(jobData);

                    if (["COMPLETED", "FAILED", "PARTIAL"].includes(jobData.status)) {
                        clearInterval(interval);
                    }
                }
            } catch {
                console.error("Failed to fetch job status");
            }
        }, 1800);

        return () => clearInterval(interval);
    }, [jobId]);

    if (!show) return null;

    const progress =
        job && job.total_words > 0
            ? Math.floor((job.completed_words / job.total_words) * 100)
            : 0;

    return (
        <div className="fixed top-0 right-0 w-[480px] h-full bg-white shadow-2xl border-l z-50 animate-slideIn overflow-y-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 pt-6 px-6">
                <div>
                    <h2 className="text-2xl font-semibold">Auto Create Vocabulary</h2>
                    <p className="text-slate-500 text-sm mt-1">Generate new words using AI</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            <div className="px-6 pb-10">

                {/* INPUT MODE */}
                {!jobId && (
                    <>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                            Enter a list of words
                        </label>

                        <textarea
                            placeholder={`apple\nrun\nbeautiful\n...`}
                            className="input h-48 resize-none"
                            value={inputWords}
                            onChange={(e) => setInputWords(e.target.value)}
                        />

                        <button
                            onClick={submitWords}
                            disabled={loading || inputWords.trim() === ""}
                            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            <Sparkles className="w-5 h-5" />
                            Start Auto Create
                        </button>
                    </>
                )}

                {/* JOB STATUS */}
                {jobId && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Job #{jobId}</h3>
                            <span className="text-sm text-slate-500">{progress}%</span>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-full bg-slate-200 h-2 rounded-full mb-4">
                            <div
                                style={{ width: `${progress}%` }}
                                className="h-2 bg-brand rounded-full transition-all"
                            />
                        </div>

                        <div className="text-slate-600 text-sm mb-4">
                            {job?.completed_words}/{job?.total_words} completed
                        </div>

                        {/* WORD ITEMS */}
                        <div className="space-y-3">
                            {job?.items?.map((item: VocabJobItem) => (
                                <div
                                    key={item.id}
                                    className="border rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition"
                                >
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="font-medium">{item.word}</p>
                                            <p className="text-xs text-slate-500">{item.status}</p>

                                            {item.error_message && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {item.error_message}
                                                </p>
                                            )}
                                        </div>

                                        {item.status === "RUNNING" && (
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                        )}
                                        {item.status === "SUCCESS" && (
                                            <span className="text-green-600 text-lg font-bold">✓</span>
                                        )}
                                        {item.status === "FAILED" && (
                                            <span className="text-red-600 text-lg font-bold">✗</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Finished actions */}
                        {job?.status === "COMPLETED" && (
                            <div className="mt-6 text-center">
                                <p className="font-medium text-green-600 mb-2">All words created!</p>
                                <button
                                    onClick={() => {
                                        setJobId(null);
                                        setJob(null);
                                        setInputWords("");
                                    }}
                                    className="btn-secondary px-4 py-2 rounded-lg"
                                >
                                    Create Another Batch
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VocabAutoCreateSection;
