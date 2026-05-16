import type React from "react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { DailyMetrics, YouTubeChannel } from "../../types/youtube";

const YouTubeAnalyticsPage: React.FC = () => {
    const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
    const [channels, setChannels] = useState<YouTubeChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [selectedChannelId, setSelectedChannelId] = useState<number | undefined>();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
            const [metricsRes, channelsRes] = await Promise.all([
                api.getAnalytics({ from, channelId: selectedChannelId }),
                api.listChannels({ size: 100 }),
            ]);
            setMetrics(metricsRes.data ?? []);
            setChannels(channelsRes.data ?? []);
            setLoading(false);
        };
        void load();
    }, [days, selectedChannelId]);

    const totalDiscovered = metrics.reduce((s, m) => s + m.videos_discovered, 0);
    const totalQueued = metrics.reduce((s, m) => s + m.videos_queued, 0);
    const totalFinalized = metrics.reduce((s, m) => s + m.videos_finalized, 0);
    const totalAutoFinalized = metrics.reduce((s, m) => s + m.videos_auto_finalized, 0);

    const maxFinalized = Math.max(...metrics.map((m) => m.videos_finalized), 1);

    // Aggregate per channel
    type ChannelAgg = {
        channel_id: number;
        discovered: number;
        queued: number;
        finalized: number;
        auto_finalized: number;
        failed: number;
    };
    const channelAgg = metrics.reduce<Record<number, ChannelAgg>>((acc, m) => {
        if (!acc[m.channel_id]) {
            acc[m.channel_id] = {
                channel_id: m.channel_id,
                discovered: 0,
                queued: 0,
                finalized: 0,
                auto_finalized: 0,
                failed: 0,
            };
        }
        acc[m.channel_id].discovered += m.videos_discovered;
        acc[m.channel_id].queued += m.videos_queued;
        acc[m.channel_id].finalized += m.videos_finalized;
        acc[m.channel_id].auto_finalized += m.videos_auto_finalized;
        acc[m.channel_id].failed += m.videos_failed;
        return acc;
    }, {});

    const channelRows = Object.values(channelAgg);
    const channelMap = new Map(channels.map((c) => [c.id, c]));

    return (
        <div className="space-y-6 px-8 py-6">
            {/* HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">YouTube Analytics</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ingestion pipeline performance over time
                    </p>
                </div>

                {/* FILTERS */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Date range buttons */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        {([7, 30, 90] as const).map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDays(d)}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                    days === d
                                        ? "bg-slate-900 text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                Last {d} days
                            </button>
                        ))}
                    </div>

                    {/* Channel filter */}
                    <select
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        value={selectedChannelId ?? ""}
                        onChange={(e) =>
                            setSelectedChannelId(
                                e.target.value !== "" ? Number(e.target.value) : undefined,
                            )
                        }
                    >
                        <option value="">All Channels</option>
                        {channels.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                    Loading analytics...
                </div>
            ) : (
                <>
                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Total Discovered", value: totalDiscovered },
                            { label: "Total Queued", value: totalQueued },
                            { label: "Total Finalized", value: totalFinalized },
                            { label: "Auto-finalized", value: totalAutoFinalized },
                        ].map(({ label, value }) => (
                            <div
                                key={label}
                                className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4"
                            >
                                <p className="text-2xl font-bold text-slate-900 tabular-nums">
                                    {value.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* DAILY BAR CHART */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-slate-700 mb-4">
                            Videos Finalized per Day
                        </h2>
                        {metrics.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                                No data for this period.
                            </div>
                        ) : (
                            <div className="flex items-end gap-1 h-32">
                                {metrics.map((m) => {
                                    const height = Math.round(
                                        (m.videos_finalized / maxFinalized) * 100,
                                    );
                                    return (
                                        <div
                                            key={m.metric_date}
                                            className="flex-1 flex flex-col items-center gap-1 group relative"
                                        >
                                            <div
                                                className="w-full bg-emerald-400 rounded-t transition-all"
                                                style={{
                                                    height: `${height}%`,
                                                    minHeight: m.videos_finalized > 0 ? "4px" : "0",
                                                }}
                                            />
                                            <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                                {m.metric_date}: {m.videos_finalized} finalized
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* PER-CHANNEL BREAKDOWN TABLE */}
                    {channelRows.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h2 className="text-sm font-semibold text-slate-700">
                                    Per-Channel Breakdown
                                </h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                                        <th className="px-4 py-3 text-left">Channel</th>
                                        <th className="px-4 py-3 text-right">Discovered</th>
                                        <th className="px-4 py-3 text-right">Queued</th>
                                        <th className="px-4 py-3 text-right">Finalized</th>
                                        <th className="px-4 py-3 text-right">Auto-finalized</th>
                                        <th className="px-4 py-3 text-right">Failed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {channelRows.map((row) => {
                                        const ch = channelMap.get(row.channel_id);
                                        return (
                                            <tr
                                                key={row.channel_id}
                                                className="border-b border-slate-50 hover:bg-slate-50/50"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {ch?.thumbnail_url && (
                                                            <img
                                                                src={ch.thumbnail_url}
                                                                alt={ch.title}
                                                                className="w-6 h-6 rounded object-cover"
                                                            />
                                                        )}
                                                        <span className="font-medium text-slate-800">
                                                            {ch?.title ??
                                                                `Channel ${row.channel_id}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                                                    {row.discovered.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                                                    {row.queued.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                                                    {row.finalized.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    <span className="text-emerald-600 font-medium">
                                                        {row.auto_finalized.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    <span
                                                        className={
                                                            row.failed > 0
                                                                ? "text-rose-600 font-medium"
                                                                : "text-slate-400"
                                                        }
                                                    >
                                                        {row.failed.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default YouTubeAnalyticsPage;
