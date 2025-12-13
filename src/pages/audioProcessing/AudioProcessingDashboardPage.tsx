import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, PlusCircle, Search, Loader2, FolderOpen } from "lucide-react";
import { api } from "../../api/client";
import type { AudioJob, AudioJobStatus } from "../../types/audioProcessing";
import { Input } from "../../components/ui/Input";
import { Btn } from "../../components/ui/Btn";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";

type StatusFilter = "ALL" | AudioJobStatus;

const statusFilters: StatusFilter[] = [
    "ALL",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "FINALIZED",
    "REPROCESSING",
    "PARTIAL",
];

const AudioProcessingDashboardPage: React.FC = () => {
    const [jobs, setJobs] = useState<AudioJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [search, setSearch] = useState("");

    const loadJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = await api.getAudioProcessingJobs();
            setJobs(payload);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load jobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadJobs();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadJobs();
        setRefreshing(false);
    };

    const filteredJobs = useMemo(() => {
        const term = search.trim().toLowerCase();
        return jobs.filter((job) => {
            const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
            const matchesSearch =
                !term ||
                String(job.id).includes(term) ||
                job.lessonName?.toLowerCase().includes(term) ||
                job.transcript?.toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [jobs, search, statusFilter]);

    const summaryStats = useMemo(() => {
        const activeStatuses: AudioJobStatus[] = ["PROCESSING", "PENDING", "REPROCESSING", "RUNNING"];
        const completedStatuses: AudioJobStatus[] = ["COMPLETED", "FINALIZED"];
        return [
            { label: "Total jobs", value: jobs.length },
            { label: "Active", value: jobs.filter((job) => activeStatuses.includes(job.status)).length },
            { label: "Completed", value: jobs.filter((job) => completedStatuses.includes(job.status)).length },
            { label: "Failed", value: jobs.filter((job) => job.status === "FAILED").length },
        ];
    }, [jobs]);

    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-28 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
                <div className="absolute top-20 right-[-90px] h-80 w-80 rounded-full bg-gradient-to-br from-brand/25 via-brand/10 to-transparent blur-3xl" />
                <div className="absolute bottom-[-120px] left-10 h-72 w-72 rounded-full bg-gradient-to-tr from-brand/18 via-transparent to-transparent blur-3xl" />
            </div>

            <div className="space-y-8 relative">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand via-brand to-brand/80 text-white shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_32%)]" />
                <div className="relative px-5 sm:px-6 lg:px-8 py-6 sm:py-7 space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                Lesson Audio Processing
                            </div>
                            <h1 className="text-3xl font-semibold">Audio Processing Dashboard</h1>
                            <p className="text-sm text-white/80">
                                Track uploads, processing status, and jump into sentence edits without losing momentum.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Btn.Secondary
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20"
                            >
                                <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </Btn.Secondary>

                            <Link to="/admin/audio-processing/upload" className="w-full sm:w-auto">
                                <Btn.Primary className="w-full sm:w-auto shadow-lg shadow-black/15">
                                    <PlusCircle className="w-4 h-4" />
                                    New Upload
                                </Btn.Primary>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {summaryStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur"
                            >
                                <div className="text-[11px] uppercase tracking-wide text-white/70">{stat.label}</div>
                                <div className="text-2xl font-semibold">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-white via-white to-brand/5 rounded-card shadow-card border border-slate-100 p-5 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="w-4 h-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by job ID, lesson name, or transcript text"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {statusFilters.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`
                                    px-3 py-1.5 rounded-full text-xs font-medium border
                                    ${statusFilter === status
                                    ? "bg-brand text-white border-brand"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}
                                `}
                            >
                                {status === "ALL" ? "All" : status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-slate-500" />
                        <h2 className="text-base font-semibold text-slate-900">Jobs</h2>
                        <span className="text-xs text-slate-500">({filteredJobs.length})</span>
                    </div>
                </div>

                {error && (
                    <div className="px-5 py-3 text-sm text-rose-600 bg-rose-50 border-t border-rose-100">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="px-5 py-10 flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading jobs…
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="px-5 py-12 text-center text-slate-500">
                        No jobs found. Try adjusting your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-slate-500 uppercase text-xs tracking-wide">
                            <tr>
                                <th className="px-5 py-3">Job</th>
                                <th className="px-5 py-3">Lesson</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Created</th>
                                <th className="px-5 py-3">Updated</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {filteredJobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50/60">
                                    <td className="px-5 py-3">
                                        <div className="font-semibold text-slate-900">#{job.id}</div>
                                        <div className="text-[12px] text-slate-500">
                                            Transcript: {job.transcript?.slice(0, 38) || "—"}
                                            {job.transcript?.length > 38 ? "…" : ""}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-sm font-medium text-slate-900">
                                            {job.lessonName || `Lesson ${job.lessonId}`}
                                        </div>
                                        <div className="text-[12px] text-slate-500">ID {job.lessonId}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">
                                        {new Date(job.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">
                                        {new Date(job.updatedAt).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <Link
                                            to={`/admin/audio-processing/jobs/${job.id}`}
                                            className="text-brand font-semibold hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default AudioProcessingDashboardPage;
