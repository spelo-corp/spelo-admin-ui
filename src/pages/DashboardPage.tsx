import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardStats, ProcessingJob } from "../types";
import StatsCard from "../components/common/StatsCard";
import { Link } from "react-router-dom";
import { Btn } from "../components/ui/Btn";
import { BookOpen, FileAudio2, Settings, Users, RefreshCcw } from "lucide-react";
import PageHeader from "../components/common/PageHeader";

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [jobs, setJobs] = useState<ProcessingJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [statsRes, jobsRes] = await Promise.all([
                    api.getDashboardStats(),
                    api.getProcessingJobs({ page: 1, per_page: 5 }),
                ]);
                if (statsRes.success) setStats(statsRes.stats);
                if (jobsRes.success) setJobs(jobsRes.jobs);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-100 text-emerald-700";
            case "failed":
                return "bg-rose-100 text-rose-700";
            case "extracting":
                return "bg-sky-100 text-sky-700";
            case "reviewing":
                return "bg-amber-100 text-amber-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Dashboard"
                description="Overview of lessons, jobs, and system activity."
                actions={
                    <Btn.HeroSecondary onClick={() => window.location.reload()}>
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </Btn.HeroSecondary>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Lessons"
                    value={stats?.total_lessons ?? 0}
                    icon={BookOpen}
                />
                <StatsCard
                    label="Processing Jobs"
                    value={stats?.processing_jobs ?? 0}
                    icon={Settings}
                />
                <StatsCard
                    label="Audio Files"
                    value={stats?.audio_files ?? 0}
                    icon={FileAudio2}
                />
                <StatsCard
                    label="Active Users"
                    value={stats?.active_users ?? 0}
                    icon={Users}
                />
            </div>

            {/* Recent Jobs Panel */}
            <div className="bg-white rounded-card shadow-card border border-slate-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Recent Processing Jobs
                    </h2>

                    <Link
                        to="/admin/processing-jobs"
                        className="text-sm text-brand hover:underline"
                    >
                        View all →
                    </Link>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="text-center text-slate-400 text-sm">
                            Loading dashboard…
                        </div>
                    ) : jobs.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center">
                            No recent processing jobs.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between border-b last:border-b-0 border-slate-100 pb-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {job.lesson_name || `Lesson ${job.lesson_id}`}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Job #{job.id} ·{" "}
                                            {new Date(job.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    <span
                                        className={`
                      px-2 py-1 rounded-full text-xs font-medium 
                      ${getStatusColor(job.current_step)}
                    `}
                                    >
                    {job.current_step}
                  </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CTA Section */}
            <div
                className="
          bg-gradient-to-br from-brand to-brand-dark text-white
          rounded-card shadow-shell p-6 flex flex-col sm:flex-row
          items-center justify-between gap-6
        "
            >
                <div>
                    <div className="text-lg font-semibold">
                        Ready to add more lessons?
                    </div>
                    <div className="text-sm text-white/80">
                        Upload audio, transcripts and generate aligned segments instantly.
                    </div>
                </div>

                <Btn.Primary className="px-6 py-2">
                    + Create Lesson
                </Btn.Primary>
            </div>
        </div>
    );
};

export default DashboardPage;
