import { Youtube } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { YouTubeChannel } from "../../types/youtube";

export interface YouTubeChannelOutletContext {
    channel: YouTubeChannel;
    reloadChannel: () => Promise<void>;
}

const NAV_TABS = [
    { label: "Videos", path: "videos" },
    { label: "Settings", path: "settings" },
    { label: "Sync History", path: "sync-history" },
] as const;

const YouTubeChannelDetailPage: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const [channel, setChannel] = useState<YouTubeChannel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reloadChannel = useCallback(async () => {
        if (!channelId) return;
        try {
            const res = await api.getChannel(Number(channelId));
            if (res.success) setChannel(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load channel.");
        }
    }, [channelId]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        reloadChannel().finally(() => setLoading(false));
    }, [reloadChannel]);

    if (loading) {
        return (
            <div className="px-8 py-6 space-y-4">
                <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-10 rounded-xl bg-slate-100 animate-pulse w-48" />
            </div>
        );
    }

    if (error || !channel) {
        return (
            <div className="px-8 py-12 text-center text-rose-600">
                {error ?? "Channel not found."}
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {/* HEADER CARD */}
            <div className="bg-white border-b border-slate-100 px-8 py-6">
                <div className="flex items-start gap-4">
                    {channel.thumbnail_url ? (
                        <img
                            src={channel.thumbnail_url}
                            alt={channel.title}
                            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Youtube className="w-8 h-8 text-red-500" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-slate-900 truncate">
                                {channel.title}
                            </h1>
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${
                                    channel.is_active
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                            >
                                {channel.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {channel.handle && (
                            <p className="text-sm text-slate-400 mt-0.5">{channel.handle}</p>
                        )}
                        {channel.subscriber_count !== null && (
                            <p className="text-xs text-slate-500 mt-1">
                                {channel.subscriber_count.toLocaleString()} subscribers
                            </p>
                        )}
                        {channel.description && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                {channel.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* TAB NAV */}
                <nav className="flex gap-1 mt-6 border-b border-slate-100 -mb-6 pb-0">
                    {NAV_TABS.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                    isActive
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                }`
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* TAB CONTENT */}
            <div className="px-8 py-6">
                <Outlet
                    context={{ channel, reloadChannel } satisfies YouTubeChannelOutletContext}
                />
            </div>
        </div>
    );
};

export default YouTubeChannelDetailPage;
