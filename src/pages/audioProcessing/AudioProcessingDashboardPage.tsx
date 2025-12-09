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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                        Lesson Audio Processing
                    </p>
                    <h1 className="text-3xl font-semibold text-slate-900">
                        Audio Processing Dashboard
                    </h1>
                    <p className="text-sm text-slate-500">
                        Track uploads, processing status, and jump into sentence edits.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Btn.Secondary onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Btn.Secondary>

                    <Link to="/admin/audio-processing/upload">
                        <Btn.Primary>
                            <PlusCircle className="w-4 h-4" />
                            New Upload
                        </Btn.Primary>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 flex flex-col gap-4">
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
    );
};

export default AudioProcessingDashboardPage;
