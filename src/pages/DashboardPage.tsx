import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import StatsCard from "../components/common/StatsCard";
import { Link } from "react-router-dom";
import { Btn } from "../components/ui/Btn";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    BookOpen,
    CalendarDays,
    FileAudio2,
    Gauge,
    Layers,
    ListChecks,
    RefreshCcw,
    Settings,
    ShieldAlert,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import Sparkline from "../components/dashboard/Sparkline";
import { Skeleton } from "../components/ui/Skeleton";
import type {
    AdminDashboardActivityItem,
    AdminDashboardAlertsResponse,
    AdminDashboardOverviewResponse,
    AdminDashboardRecentAudioFilesResponse,
    AdminDashboardRecentLessonsResponse,
    DashboardRange,
} from "../types/adminDashboard";
import type { JobListItemDTO } from "../types/jobService";

const DashboardPage: React.FC = () => {
    const [range, setRange] = useState<DashboardRange>("7d");
    const [overview, setOverview] = useState<AdminDashboardOverviewResponse["data"] | null>(null);
    const [alerts, setAlerts] = useState<AdminDashboardAlertsResponse["data"] | null>(null);
    const [activity, setActivity] = useState<AdminDashboardActivityItem[]>([]);
    const [recentLessons, setRecentLessons] = useState<AdminDashboardRecentLessonsResponse["data"]>([]);
    const [recentAudioFiles, setRecentAudioFiles] = useState<AdminDashboardRecentAudioFilesResponse["data"]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                overviewRes,
                alertsRes,
                activityRes,
                recentLessonsRes,
                recentAudioRes,
            ] = await Promise.all([
                api.getAdminDashboardOverview(range),
                api.getAdminDashboardAlerts({ stuck_minutes: 30, limit: 10 }),
                api.getAdminDashboardActivity({ limit: 5 }),
                api.getAdminDashboardRecentLessons({ limit: 5 }),
                api.getAdminDashboardRecentAudioFiles({ limit: 5 }),
            ]);

            setOverview(overviewRes.data);
            setAlerts(alertsRes.data);
            setActivity(activityRes.data ?? []);
            setRecentLessons(recentLessonsRes.data ?? []);
            setRecentAudioFiles(recentAudioRes.data ?? []);
            setLastRefreshedAt(new Date());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load dashboard.");
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const getJobStatusPill = (status?: string) => {
        const upper = (status ?? "").toUpperCase();
        if (upper === "COMPLETED") return "bg-emerald-100 text-emerald-700";
        if (upper === "FAILED") return "bg-rose-100 text-rose-700";
        if (upper === "PARTIAL") return "bg-amber-100 text-amber-700";
        if (upper === "RUNNING") return "bg-sky-100 text-sky-700";
        if (upper === "PENDING") return "bg-slate-100 text-slate-700";
        if (upper === "WAITING_FOR_INPUT") return "bg-violet-100 text-violet-700";
        if (upper === "REVIEWING") return "bg-indigo-100 text-indigo-700";
        return "bg-slate-100 text-slate-700";
    };

    const fmt = useMemo(() => new Intl.NumberFormat(undefined), []);
    const pctFmt = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: "percent",
                maximumFractionDigits: 1,
            }),
        []
    );
    const dtFmt = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            }),
        []
    );

    const kpis = overview?.kpis;
    const cards = useMemo(() => {
        const failureRate = (kpis?.jobs_failure_rate_percent ?? 0) / 100;
        return [
            {
                label: "Lessons",
                value: fmt.format(kpis?.lessons_total ?? 0),
                hint: `${fmt.format(kpis?.lessons_active ?? 0)} active`,
                icon: BookOpen,
                tone: "brand" as const,
                href: "/admin/lessons",
            },
            {
                label: "Users",
                value: fmt.format(kpis?.users_total ?? 0),
                hint: `${fmt.format(kpis?.users_active ?? 0)} active`,
                icon: Users,
                tone: "neutral" as const,
                href: "/admin/users",
            },
            {
                label: "Audio uploads",
                value: fmt.format(kpis?.audio_files_total ?? 0),
                hint: "All lessons",
                icon: FileAudio2,
                tone: "brand" as const,
                href: "/admin/audio-files",
            },
            {
                label: "Jobs total",
                value: fmt.format(kpis?.jobs_total ?? 0),
                hint: `${fmt.format(kpis?.jobs_completed ?? 0)} completed`,
                icon: Settings,
                tone: "neutral" as const,
                href: "/admin/jobs",
            },
            {
                label: "Jobs running",
                value: fmt.format(kpis?.jobs_running ?? 0),
                hint: `${fmt.format(kpis?.jobs_pending ?? 0)} pending`,
                icon: Activity,
                tone: "brand" as const,
                href: "/admin/jobs",
            },
            {
                label: "Jobs failed",
                value: fmt.format(kpis?.jobs_failed ?? 0),
                hint: `Failure rate ${pctFmt.format(failureRate)}`,
                icon: ShieldAlert,
                tone: (kpis?.jobs_failed ?? 0) > 0 ? ("bad" as const) : ("good" as const),
                href: "/admin/jobs",
            },
            {
                label: "Jobs partial",
                value: fmt.format(kpis?.jobs_partial ?? 0),
                hint: "Needs review",
                icon: AlertTriangle,
                tone: (kpis?.jobs_partial ?? 0) > 0 ? ("warn" as const) : ("neutral" as const),
                href: "/admin/jobs",
            },
            {
                label: "Lessons inactive",
                value: fmt.format(kpis?.lessons_inactive ?? 0),
                hint: "Draft / hidden",
                icon: Layers,
                tone: "neutral" as const,
                href: "/admin/lessons",
            },
        ];
    }, [fmt, kpis, pctFmt]);

    const renderJobLink = (job: JobListItemDTO) => {
        if (job.job_type === "AUDIO_ALIGN" || job.job_type === "AUDIO_PROCESSING") {
            return `/admin/jobs/audio/jobs/${job.id}`;
        }
        if (job.job_type === "YOUTUBE_ALIGN") {
            return `/admin/jobs/youtube/${job.id}`;
        }
        return null;
    };

    const series = overview?.series;
    const recentSeries = useMemo(() => (series ?? []).slice(-14), [series]);
    const jobsCreatedSeries = useMemo(
        () => recentSeries.map((s) => s.jobs_created ?? 0),
        [recentSeries]
    );
    const jobsCompletedSeries = useMemo(
        () => recentSeries.map((s) => s.jobs_completed ?? 0),
        [recentSeries]
    );
    const jobsFailedSeries = useMemo(
        () => recentSeries.map((s) => s.jobs_failed ?? 0),
        [recentSeries]
    );

    const jobsCreatedTotal = useMemo(
        () => jobsCreatedSeries.reduce((a, b) => a + b, 0),
        [jobsCreatedSeries]
    );
    const jobsCompletedTotal = useMemo(
        () => jobsCompletedSeries.reduce((a, b) => a + b, 0),
        [jobsCompletedSeries]
    );
    const jobsFailedTotal = useMemo(
        () => jobsFailedSeries.reduce((a, b) => a + b, 0),
        [jobsFailedSeries]
    );

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
                            <Sparkles className="w-3.5 h-3.5" />
                            Admin Overview
                        </div>
                    }
                    title="Dashboard"
                    description="Quick health check, key metrics, and shortcuts to the busiest workflows."
                    actions={
                        <>
                            {lastRefreshedAt ? (
                                <div className="hidden sm:flex items-center gap-1 text-xs text-white/80">
                                    <CalendarDays className="w-4 h-4" />
                                    {dtFmt.format(lastRefreshedAt)}
                                </div>
                            ) : null}

                            <Btn.HeroSecondary onClick={loadDashboard} disabled={loading}>
                                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Btn.HeroSecondary>

                            <Link to="/admin/jobs/audio/upload" className="w-full sm:w-auto">
                                <Btn.HeroPrimary className="w-full sm:w-auto">
                                    <FileAudio2 className="w-4 h-4" />
                                    New upload
                                </Btn.HeroPrimary>
                            </Link>
                        </>
                    }
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex flex-wrap items-center gap-2">
                            {(["24h", "7d", "30d"] as DashboardRange[]).map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setRange(value)}
                                    disabled={loading}
                                    aria-pressed={range === value}
                                    className={`
                                        px-4 py-2 rounded-full text-sm font-semibold border transition
                                        ${range === value
                                            ? "bg-white text-slate-900 border-white shadow-lg shadow-black/10"
                                            : "bg-white/10 text-white border-white/25 hover:bg-white/20"}
                                        disabled:opacity-60
                                    `}
                                >
                                    {value === "24h" ? "Last 24h" : value === "7d" ? "Last 7d" : "Last 30d"}
                                </button>
                            ))}
                        </div>

                        {overview?.bucket ? (
                            <div className="text-xs text-white/80">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                                    <Gauge className="w-4 h-4" />
                                    Buckets: {overview.bucket}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </PageHeader>

                {error ? (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                ) : null}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-card shadow-card border border-slate-100 p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-2xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-24 rounded-full" />
                                        <Skeleton className="h-4 w-32 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        cards.map((card) => (
                            <Link
                                key={card.label}
                                to={card.href}
                                className="block hover:-translate-y-0.5 transition-transform"
                            >
                                <StatsCard
                                    label={card.label}
                                    value={card.value}
                                    hint={card.hint}
                                    icon={card.icon}
                                    tone={card.tone}
                                />
                            </Link>
                        ))
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <SectionCard title="Quick Actions" icon={ListChecks} bodyClassName="p-5 space-y-2">
                        <Link
                            to="/admin/lessons"
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <BookOpen className="w-4 h-4 text-brand" />
                                Manage lessons
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link
                            to="/admin/jobs"
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Activity className="w-4 h-4 text-brand" />
                                Review jobs
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link
                            to="/admin/jobs/audio/upload"
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FileAudio2 className="w-4 h-4 text-brand" />
                                Upload audio
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link
                            to="/admin/users"
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Users className="w-4 h-4 text-brand" />
                                Users
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link
                            to="/admin/dictionary"
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <BookOpen className="w-4 h-4 text-brand" />
                                Dictionary
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                    </SectionCard>

                    <SectionCard
                        title="Alerts"
                        icon={ShieldAlert}
                        action={
                            <Link to="/admin/jobs" className="text-sm text-brand hover:underline">
                                View jobs →
                            </Link>
                        }
                        bodyClassName="p-5 space-y-4"
                    >
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-40 rounded-full" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ) : !alerts ? (
                            <div className="text-center text-slate-500 text-sm">No data.</div>
                        ) : (
                            ([
                                { label: "Stuck (RUNNING)", items: alerts.stuck_jobs ?? [] },
                                { label: "Failed", items: alerts.failed_jobs ?? [] },
                                { label: "Partial", items: alerts.partial_jobs ?? [] },
                            ] as const).map((section) => (
                                <div key={section.label} className="space-y-2">
                                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                        {section.label} ({section.items.length})
                                    </div>
                                    {section.items.length === 0 ? (
                                        <div className="text-sm text-slate-500">None</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {section.items.slice(0, 4).map((job) => {
                                                const link = renderJobLink(job);
                                                const row = (
                                                    <div className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2 hover:bg-slate-50">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-slate-900 truncate">
                                                                #{job.id} · {job.job_type}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                Updated {dtFmt.format(new Date(job.updated_at))}
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusPill(job.status)}`}
                                                        >
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                );
                                                return link ? (
                                                    <Link key={job.id} to={link} className="block">
                                                        {row}
                                                    </Link>
                                                ) : (
                                                    <div key={job.id}>{row}</div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </SectionCard>

                    <SectionCard title="Activity" icon={CalendarDays} bodyClassName="p-5">
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ) : activity.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm">
                                <div className="inline-flex items-center gap-2 justify-center">
                                    <AlertCircle className="w-4 h-4" />
                                    No recent activity.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activity.slice(0, 8).map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-slate-100 rounded-xl px-3 py-2 hover:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="text-sm text-slate-800">{item.message}</div>
                                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                                {dtFmt.format(new Date(item.created_at))}
                                            </div>
                                        </div>
                                        {item.entity?.kind === "LESSON" && typeof item.entity.id === "number" ? (
                                            <Link
                                                to={`/admin/lessons/${item.entity.id}`}
                                                className="text-xs text-brand hover:underline"
                                            >
                                                View lesson →
                                            </Link>
                                        ) : null}
                                        {item.entity?.kind === "JOB" && typeof item.entity.id === "number" ? (
                                            <Link
                                                to={`/admin/jobs/audio/jobs/${item.entity.id}`}
                                                className="text-xs text-brand hover:underline"
                                            >
                                                View job →
                                            </Link>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Jobs Trend"
                        icon={TrendingUp}
                        action={
                            <div className="text-xs text-slate-500">
                                {recentSeries.length > 0 ? `${recentSeries.length} buckets` : "—"}
                            </div>
                        }
                    >
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ) : recentSeries.length < 2 ? (
                            <div className="text-center text-slate-500 text-sm">Not enough data to render a trend.</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">Created</div>
                                        <div className="text-xs text-slate-500">{fmt.format(jobsCreatedTotal)} total</div>
                                    </div>
                                    <Sparkline data={jobsCreatedSeries} strokeClassName="stroke-brand" ariaLabel="Jobs created" />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">Completed</div>
                                        <div className="text-xs text-slate-500">{fmt.format(jobsCompletedTotal)} total</div>
                                    </div>
                                    <Sparkline
                                        data={jobsCompletedSeries}
                                        strokeClassName="stroke-emerald-600"
                                        ariaLabel="Jobs completed"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">Failed</div>
                                        <div className="text-xs text-slate-500">{fmt.format(jobsFailedTotal)} total</div>
                                    </div>
                                    <Sparkline data={jobsFailedSeries} strokeClassName="stroke-rose-600" ariaLabel="Jobs failed" />
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="Jobs By Type" icon={Settings}>
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                        ) : !overview?.jobs_by_type?.length ? (
                            <div className="text-center text-slate-500 text-sm">No job type data.</div>
                        ) : (
                            <div className="space-y-3">
                                {overview.jobs_by_type.slice(0, 6).map((row) => {
                                    const total = Math.max(0, row.total ?? 0);
                                    const completed = Math.max(0, row.completed ?? 0);
                                    const completionPct = total ? Math.round((completed / total) * 100) : 0;
                                    return (
                                        <div key={row.job_type} className="rounded-xl border border-slate-100 p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-slate-900 truncate">
                                                        {row.job_type}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {fmt.format(total)} total · {fmt.format(row.running ?? 0)} running · {fmt.format(row.pending ?? 0)} pending
                                                    </div>
                                                </div>
                                                <div className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                                    {completionPct}% done
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${completionPct}%` }} />
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                                    Completed {fmt.format(row.completed ?? 0)}
                                                </span>
                                                <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-medium">
                                                    Failed {fmt.format(row.failed ?? 0)}
                                                </span>
                                                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                                                    Partial {fmt.format(row.partial ?? 0)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Recent Lessons"
                        icon={BookOpen}
                        action={
                            <Link to="/admin/lessons" className="text-sm text-brand hover:underline">
                                View all →
                            </Link>
                        }
                    >
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ) : recentLessons.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm">No recent lessons.</div>
                        ) : (
                            <div className="space-y-2">
                                {recentLessons.slice(0, 6).map((lesson) => (
                                    <Link
                                        key={lesson.id}
                                        to={`/admin/lessons/${lesson.id}`}
                                        className="block border border-slate-100 rounded-xl px-3 py-2 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-slate-900 truncate">
                                                    {lesson.name} <span className="text-slate-400">#{lesson.id}</span>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Level {lesson.level} · Category {lesson.category_id}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                                {lesson.created_at ? dtFmt.format(new Date(lesson.created_at)) : "—"}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Recent Audio Uploads"
                        icon={FileAudio2}
                        action={
                            <Link to="/admin/audio-files" className="text-sm text-brand hover:underline">
                                View audio →
                            </Link>
                        }
                    >
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ) : recentAudioFiles.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm">No recent uploads.</div>
                        ) : (
                            <div className="space-y-2">
                                {recentAudioFiles.slice(0, 6).map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/admin/lessons/${item.lesson_id}/audio`}
                                        className="block border border-slate-100 rounded-xl px-3 py-2 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-slate-900 truncate">
                                                    Listening #{item.id} · Lesson #{item.lesson_id}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.audio ? "Audio attached" : "Audio pending"}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                                {dtFmt.format(new Date(item.created_at))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </SectionCard>
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
                        <div className="text-lg font-semibold">Keep content flowing</div>
                        <div className="text-sm text-white/80">
                            Create lessons, upload audio, and review processing jobs without leaving your rhythm.
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <Link to="/admin/lessons" className="w-full sm:w-auto">
                            <Btn.HeroPrimary className="w-full sm:w-auto">
                                + New lesson
                            </Btn.HeroPrimary>
                        </Link>
                        <Link to="/admin/jobs" className="w-full sm:w-auto">
                            <Btn.HeroSecondary className="w-full sm:w-auto">
                                Go to jobs
                                <ArrowRight className="w-4 h-4" />
                            </Btn.HeroSecondary>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
