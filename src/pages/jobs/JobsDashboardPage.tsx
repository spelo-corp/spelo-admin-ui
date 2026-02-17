import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, PlusCircle, Search, Loader2, FolderOpen } from "lucide-react";
import { api } from "../../api/client";
import type { JobType } from "../../types/jobService";
import { Input } from "../../components/ui/Input";
import { Btn } from "../../components/ui/Btn";
import PageHeader from "../../components/common/PageHeader";

type TypeFilter = "ALL" | JobType;

const typeFilters: TypeFilter[] = [
    "ALL",
    "AUDIO_ALIGN",
    "YOUTUBE_ALIGN",
    "VOCAB_ENRICH",
    "VOCAB_EXTRACT",
    "VOCAB_SCRIPT_MAP",
    "LESSON_TRANSLATE",
    "AI_SCORING",
    "UPLOAD_TO_R2",
    "COLLECTION_GENERATE",
];

const statusColors: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-700",
    RUNNING: "bg-sky-100 text-sky-700",
    PROCESSING: "bg-sky-100 text-sky-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    FINALIZED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-rose-100 text-rose-700",
    PARTIAL: "bg-amber-100 text-amber-700",
    WAITING_FOR_INPUT: "bg-violet-100 text-violet-700",
    REVIEWING: "bg-indigo-100 text-indigo-700",
};

const badgeColors: Record<string, string> = {
    AUDIO_ALIGN: "bg-blue-100 text-blue-700",
    YOUTUBE_ALIGN: "bg-red-100 text-red-700",
    VOCAB_ENRICH: "bg-purple-100 text-purple-700",
    VOCAB_EXTRACT: "bg-purple-100 text-purple-700",
    VOCAB_SCRIPT_MAP: "bg-purple-100 text-purple-700",
    LESSON_TRANSLATE: "bg-green-100 text-green-700",
    AI_SCORING: "bg-amber-100 text-amber-700",
    UPLOAD_TO_R2: "bg-cyan-100 text-cyan-700",
    COLLECTION_GENERATE: "bg-teal-100 text-teal-700",
};

interface JobRow {
    id: number;
    job_type: string;
    status: string;
    current_step: string | null;
    created_at: string;
    updated_at: string;
}

const JobsDashboardPage: React.FC = () => {
    const [jobs, setJobs] = useState<JobRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
    const [search, setSearch] = useState("");

    const loadJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getJobs({ size: 200 });
            const data = res.data ?? [];
            setJobs(
                data.map((j: any) => ({
                    id: j.id,
                    job_type: j.job_type ?? "UNKNOWN",
                    status: j.status ?? j.current_step ?? "UNKNOWN",
                    current_step: j.current_step ?? null,
                    created_at: j.created_at ?? "",
                    updated_at: j.updated_at ?? "",
                }))
            );
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
            const matchesType = typeFilter === "ALL" || job.job_type === typeFilter;
            const matchesSearch =
                !term ||
                String(job.id).includes(term) ||
                job.job_type.toLowerCase().includes(term);
            return matchesType && matchesSearch;
        });
    }, [jobs, search, typeFilter]);

    const summaryStats = useMemo(() => {
        const running = jobs.filter((j) => j.status === "RUNNING" || j.status === "PENDING" || j.status === "PROCESSING").length;
        const completed = jobs.filter((j) => j.status === "COMPLETED" || j.status === "FINALIZED").length;
        const failed = jobs.filter((j) => j.status === "FAILED").length;
        return [
            { label: "Total jobs", value: jobs.length },
            { label: "Active", value: running },
            { label: "Completed", value: completed },
            { label: "Failed", value: failed },
        ];
    }, [jobs]);

    const getViewLink = (job: JobRow): string | null => {
        if (job.job_type === "AUDIO_ALIGN") return `/admin/jobs/audio/jobs/${job.id}`;
        if (job.job_type === "YOUTUBE_ALIGN") return `/admin/jobs/youtube/${job.id}`;
        return null;
    };

    return (
        <div className="relative overflow-hidden px-8 py-6">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-28 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
                <div className="absolute top-20 right-[-90px] h-80 w-80 rounded-full bg-gradient-to-br from-brand/25 via-brand/10 to-transparent blur-3xl" />
                <div className="absolute bottom-[-120px] left-10 h-72 w-72 rounded-full bg-gradient-to-tr from-brand/18 via-transparent to-transparent blur-3xl" />
            </div>

            <div className="space-y-8 relative">
                <PageHeader
                    badge={
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            All Jobs
                        </div>
                    }
                    title="Jobs Dashboard"
                    description="Unified view of all processing jobs across the platform."
                    actions={
                        <>
                            <Btn.HeroSecondary onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </Btn.HeroSecondary>

                            <Link to="/admin/jobs/audio/upload" className="w-full sm:w-auto">
                                <Btn.HeroPrimary className="w-full sm:w-auto">
                                    <PlusCircle className="w-4 h-4" />
                                    New Audio Upload
                                </Btn.HeroPrimary>
                            </Link>
                        </>
                    }
                >
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
                </PageHeader>

                {/* Filters */}
                <div className="bg-gradient-to-br from-white via-white to-brand/5 rounded-card shadow-card border border-slate-100 p-5 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="w-4 h-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by job ID or type"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {typeFilters.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium border
                                        ${typeFilter === type
                                            ? "bg-brand text-white border-brand"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}
                                    `}
                                >
                                    {type === "ALL" ? "All" : type.replace(/_/g, " ")}
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
                            Loading jobs...
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
                                        <th className="px-5 py-3">Job ID</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Created</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredJobs.map((job) => {
                                        const link = getViewLink(job);
                                        const colorClass = badgeColors[job.job_type] || "bg-slate-100 text-slate-700";
                                        return (
                                            <tr key={job.id} className="hover:bg-slate-50/60">
                                                <td className="px-5 py-3">
                                                    <div className="font-semibold text-slate-900">#{job.id}</div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}>
                                                        {job.job_type.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[job.status] || "bg-slate-100 text-slate-700"}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-700">
                                                    {job.created_at ? new Date(job.created_at).toLocaleString() : "—"}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {link ? (
                                                        <Link
                                                            to={link}
                                                            className="text-brand font-semibold hover:underline"
                                                        >
                                                            View
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobsDashboardPage;
