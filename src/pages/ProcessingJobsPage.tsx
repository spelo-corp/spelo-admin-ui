import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Lesson, ProcessingJob } from "../types";
import JobCard from "../components/jobs/JobCard";
import { Btn } from "../components/ui/Btn";
import { Skeleton } from "../components/ui/Skeleton";
import PageHeader from "../components/common/PageHeader";

import {
    PlusCircle,
    RefreshCcw,
    Workflow,
    BookOpen,
    Database,
    CheckCircle2,
    AlertTriangle,
    FolderDown,
} from "lucide-react";

import { CreateJobModal } from "../components/jobs/CreateJobModal";

const CATEGORY_IDS = [1, 2, 3, 4, 5, 6];

const ProcessingJobsPage: React.FC = () => {
    const [jobs, setJobs] = useState<ProcessingJob[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // -------------------------
    // LOAD DATA
    // -------------------------
    const loadData = async () => {
        setLoading(true);
        try {
            const lessonsPromise = Promise.all(
                CATEGORY_IDS.map((categoryId) =>
                    api.getLessons({ categoryId }).catch(() => null)
                )
            ).then((lessonResponses) =>
                lessonResponses
                    .filter((res): res is { success: boolean; lessons: Lesson[] } => Boolean(res?.success))
                    .flatMap((res) => res.lessons)
            );

            const [jobsRes, mergedLessons] = await Promise.all([
                api.getProcessingJobs({ per_page: 50 }),
                lessonsPromise,
            ]);

            if (jobsRes.success) setJobs(jobsRes.jobs);
            setLessons(mergedLessons);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                title="Audio Processing"
                description="Create and monitor processing jobs through each pipeline stage."
                actions={
                    <Btn.HeroPrimary onClick={() => setModalOpen(true)}>
                        <PlusCircle className="w-4 h-4" /> New Job
                    </Btn.HeroPrimary>
                }
            />

            {/* PIPELINE */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Processing Pipeline</h2>

                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                    {[
                        { icon: PlusCircle, label: "Create Job", step: 1 },
                        { icon: Workflow, label: "Extract Sentences", step: 2 },
                        { icon: BookOpen, label: "Review & Edit", step: 3 },
                        { icon: FolderDown, label: "Upload to R2", step: 4 },
                        { icon: Database, label: "Save to DB", step: 5 },
                        { icon: CheckCircle2, label: "Completed", step: 6 },
                    ].map((item) => (
                        <div
                            key={item.step}
                            className="border-l-4 border-brand bg-shell rounded-r-xl px-3 py-2"
                        >
                            <div className="text-[11px] text-slate-500">Step {item.step}</div>
                            <div className="flex items-center gap-2 font-medium text-slate-900">
                                <item.icon className="w-3 h-3" />
                                {item.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* JOB LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Processing Jobs</h2>
                    <Btn.Secondary onClick={loadData}>
                        <RefreshCcw className="w-4 h-4" /> Refresh
                    </Btn.Secondary>
                </div>

                {/* LOADING SKELETON */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
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
                        <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto" />
                        <p className="font-medium text-slate-700">No jobs found.</p>
                        <p className="text-sm text-slate-500">
                            Create your first job to begin processing audio.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onExtract={() => api.extractSentences(job.id).then(loadData)}
                                onDelete={() =>
                                    confirm("Delete this job?") &&
                                    api.deleteJob(job.id).then(loadData)
                                }
                                onApprove={() =>
                                    api.approveJob(job.id, 1).then(() => {
                                        alert("Job approved successfully!");
                                        loadData();
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL */}
            <CreateJobModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={loadData}
                lessons={lessons}
            />
        </div>
    );
};

export default ProcessingJobsPage;
