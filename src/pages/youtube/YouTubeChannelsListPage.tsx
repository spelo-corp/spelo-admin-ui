import { BarChart2, Plus, Youtube } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import { AddChannelModal } from "../../components/youtube/AddChannelModal";
import type { QuotaStatus, YouTubeChannel } from "../../types/youtube";
import { formatRelativeTime } from "./utils";

const PAGE_SIZE = 20;

const SKELETON_ROWS = ["sk-0", "sk-1", "sk-2", "sk-3", "sk-4"];

const YouTubeChannelsListPage: React.FC = () => {
    const navigate = useNavigate();

    const [channels, setChannels] = useState<YouTubeChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [quota, setQuota] = useState<QuotaStatus | null>(null);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 300);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [search]);

    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.listChannels({
                page,
                size: PAGE_SIZE,
                search: debouncedSearch || undefined,
            });
            if (res.success) {
                setChannels(res.data);
                setTotal(res.total);
            }
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        void loadChannels();
    }, [loadChannels]);

    // Fetch quota and refresh every 60s
    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res = await api.getQuotaStatus();
                if (res.success) setQuota(res.data);
            } catch {
                // quota is non-critical, ignore errors
            }
        };
        void fetchQuota();
        const interval = setInterval(() => void fetchQuota(), 60_000);
        return () => clearInterval(interval);
    }, []);

    const handleRegistered = (channel: YouTubeChannel) => {
        setChannels((prev) => [channel, ...prev]);
        setTotal((prev) => prev + 1);
        setAddModalOpen(false);
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6 px-8 py-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">YouTube Sources</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage YouTube channels for video ingestion
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/admin/youtube/analytics"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <BarChart2 className="w-4 h-4" />
                        Analytics
                    </Link>
                    <Btn.Primary onClick={() => setAddModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Add Channel
                    </Btn.Primary>
                </div>
            </div>

            {/* QUOTA BAR */}
            {quota && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-medium">API Quota</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-2 bg-blue-500 rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, (quota.today_usage / quota.daily_limit) * 100)}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                        {quota.today_usage.toLocaleString()} / {quota.daily_limit.toLocaleString()}{" "}
                        units used today
                    </span>
                </div>
            )}

            {/* SEARCH */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                            <th className="px-4 py-3 text-left w-12" />
                            <th className="px-4 py-3 text-left">Channel</th>
                            <th className="px-4 py-3 text-right">Videos</th>
                            <th className="px-4 py-3 text-left">Last Synced</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            SKELETON_ROWS.map((key) => (
                                <tr key={key} className="border-b border-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-40 bg-slate-100 rounded animate-pulse mb-1" />
                                        <div className="h-3 w-24 bg-slate-50 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-10 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3" />
                                </tr>
                            ))
                        ) : channels.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-12 text-center text-slate-500 text-sm"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Youtube className="w-8 h-8 text-slate-300" />
                                        <p>
                                            No channels found. Add your first channel to get
                                            started.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            channels.map((channel) => {
                                const videoCount =
                                    channel.stats?.total_videos ?? channel.video_count ?? 0;
                                return (
                                    <tr
                                        key={channel.id}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            {channel.thumbnail_url ? (
                                                <img
                                                    src={channel.thumbnail_url}
                                                    alt={channel.title}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <Youtube className="w-5 h-5 text-red-500" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">
                                                {channel.title}
                                            </p>
                                            {channel.handle && (
                                                <p className="text-xs text-slate-400">
                                                    {channel.handle}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600">
                                            {videoCount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {formatRelativeTime(channel.last_synced_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                    channel.is_active
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                        : "bg-slate-100 text-slate-500 border-slate-200"
                                                }`}
                                            >
                                                {channel.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/admin/youtube/${channel.id}/videos`)
                                                }
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}{" "}
                            of {total}
                        </span>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AddChannelModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onRegistered={handleRegistered}
            />
        </div>
    );
};

export default YouTubeChannelsListPage;
