import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Lesson, ProcessingJob } from "../types";
import JobCard from "../components/jobs/JobCard";
import { useSearchParams } from "react-router-dom";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";

import { Skeleton } from "../components/ui/Skeleton";

const ProcessingJobsPage: React.FC = () => {
    const [jobs, setJobs] = useState<ProcessingJob[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchParams] = useSearchParams();

    // form fields
    const [lessonId, setLessonId] = useState<number | null>(null);
    const [type, setType] = useState(2);
    const [audioUrl, setAudioUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    const loadData = async () => {
        setLoading(true);
        try {
            const [jobsRes, lessonsRes] = await Promise.all([
                api.getProcessingJobs({ per_page: 50 }),
                api.getLessons(),
            ]);
            if (jobsRes.success) setJobs(jobsRes.jobs);
            if (lessonsRes.success) setLessons(lessonsRes.lessons);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // if ?lesson=ID then auto-fill
    useEffect(() => {
        const q = searchParams.get("lesson");
        if (q) setLessonId(Number(q));
    }, [searchParams]);

    const handleCreateJob = async () => {
        if (!lessonId) return alert("Please select lesson.");
        if (!audioUrl.trim() && !selectedFile) {
            return alert("Upload audio OR paste audio URL.");
        }

        if (selectedFile) {
            alert("Local file upload will be handled in backend later.");
        }

        await api.createProcessingJob({
            lesson_id: lessonId,
            audio_url: audioUrl || selectedFile?.name || "",
            start_time: startTime || 0,
            end_time: endTime || 0,
            type,
        });

        // reset
        setModalOpen(false);
        setSelectedFile(null);
        setAudioUrl("");
        setStartTime(0);
        setEndTime(0);
        await loadData();
    };

    const handleExtract = async (id: number) => {
        await api.extractSentences(id);
        await loadData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this job?")) return;
        await api.deleteJob(id);
        await loadData();
    };

    return (
        <div className="space-y-10">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold text-slate-900">Audio Processing</h1>
                <Btn.Primary onClick={() => setModalOpen(true)}>
                    ➕ New Processing Job
                </Btn.Primary>
            </div>

            {/* PIPELINE */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Processing Pipeline</h2>

                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                    {[
                        { label: "Create Job", step: 1 },
                        { label: "Extract Sentences", step: 2 },
                        { label: "Review & Edit", step: 3 },
                        { label: "Upload to R2", step: 4 },
                        { label: "Save to DB", step: 5 },
                        { label: "Completed", step: 6 },
                    ].map((x) => (
                        <div
                            key={x.step}
                            className="border-l-4 border-brand bg-shell rounded-r-xl px-3 py-2"
                        >
                            <div className="font-medium text-slate-900">{x.label}</div>
                            <div className="text-[11px] text-slate-500">Step {x.step}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* JOB LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Processing Jobs</h2>
                    <Btn.Secondary onClick={loadData}>⟳ Refresh</Btn.Secondary>
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-card border p-4 space-y-3">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                        <div className="text-4xl">📦</div>
                        <p className="font-medium text-slate-700">No processing jobs found.</p>
                        <p className="text-sm text-slate-500">
                            Create a new job to start processing audio.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onExtract={() => handleExtract(job.id)}
                                onDelete={() => handleDelete(job.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* CREATE JOB MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
                    <div className="bg-white rounded-card shadow-shell w-full max-w-xl p-6">

                        {/* Modal header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Create Processing Job
                            </h2>
                            <button onClick={() => setModalOpen(false)}>✕</button>
                        </div>

                        <div className="space-y-6 text-sm">

                            {/* LESSON + TYPE */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Lesson *
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={lessonId ?? ""}
                                        onChange={(e) =>
                                            setLessonId(e.target.value ? Number(e.target.value) : null)
                                        }
                                    >
                                        <option value="">Select a lesson…</option>
                                        {lessons.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.name} (Level {l.level})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Lesson Type *
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={type}
                                        onChange={(e) => setType(Number(e.target.value))}
                                    >
                                        <option value={2}>Dictation</option>
                                        <option value={1}>Full Audio</option>
                                        <option value={3}>Multiple Choice</option>
                                        <option value={4}>Shadowing</option>
                                    </select>
                                </div>
                            </div>

                            {/* UPLOAD OR URL CHOOSER */}
                            <div className="flex gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAudioUrl("");
                                        setSelectedFile(null);
                                    }}
                                    className={`px-3 py-1 rounded-full border ${
                                        selectedFile ? "bg-brand text-white" : "bg-white"
                                    }`}
                                >
                                    Upload File
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setAudioUrl(" ");
                                        setAudioUrl("");
                                    }}
                                    className={`px-3 py-1 rounded-full border ${
                                        audioUrl !== "" ? "bg-brand text-white" : "bg-white"
                                    }`}
                                >
                                    Paste URL
                                </button>
                            </div>

                            {/* FILE UPLOAD */}
                            {audioUrl === "" && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-600">
                                        Upload Audio File *
                                    </label>

                                    <div className="
                                        border border-slate-200 rounded-card p-4 text-center cursor-pointer
                                        hover:bg-slate-50 transition
                                    ">
                                        <label className="cursor-pointer text-slate-600 text-sm">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="audio/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) {
                                                        setSelectedFile(f);
                                                        setAudioUrl("");
                                                    }
                                                }}
                                            />
                                            {selectedFile ? (
                                                <span className="font-medium text-slate-900">
                                                    {selectedFile.name}
                                                </span>
                                            ) : (
                                                <>Click to upload .mp3 / .wav / .m4a</>
                                            )}
                                        </label>
                                    </div>

                                    {selectedFile && (
                                        <button
                                            className="text-xs text-rose-500 hover:underline"
                                            onClick={() => setSelectedFile(null)}
                                        >
                                            Remove file
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* URL INPUT */}
                            {selectedFile === null && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Audio URL *
                                    </label>
                                    <Input
                                        value={audioUrl}
                                        onChange={(e) => setAudioUrl(e.target.value)}
                                        placeholder="https://example.com/audio.mp3"
                                    />
                                </div>
                            )}

                            {/* START + END */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Start Time (s)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        value={startTime}
                                        onChange={(e) => setStartTime(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        End Time (s)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        value={endTime}
                                        onChange={(e) => setEndTime(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-slate-500">
                                File upload will be integrated with your R2 upload endpoint later.
                            </p>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary onClick={() => setModalOpen(false)}>
                                Cancel
                            </Btn.Secondary>
                            <Btn.Primary onClick={handleCreateJob}>
                                Create Job
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcessingJobsPage;
