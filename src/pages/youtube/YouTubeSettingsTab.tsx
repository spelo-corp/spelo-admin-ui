import type React from "react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import { formatRelativeTime } from "./utils";
import type { YouTubeChannelOutletContext } from "./YouTubeChannelDetailPage";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

function Toggle({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                ${checked ? "bg-emerald-500" : "bg-slate-200"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${checked ? "translate-x-6" : "translate-x-1"}`}
            />
        </button>
    );
}

const YouTubeSettingsTab: React.FC = () => {
    const { channel, reloadChannel } = useOutletContext<YouTubeChannelOutletContext>();

    const [defaultLevel, setDefaultLevel] = useState(channel.default_lesson_level ?? "");
    const [minDurMin, setMinDurMin] = useState(
        channel.min_duration_sec !== null ? String(Math.round(channel.min_duration_sec / 60)) : "",
    );
    const [maxDurMin, setMaxDurMin] = useState(
        channel.max_duration_sec !== null ? String(Math.round(channel.max_duration_sec / 60)) : "",
    );
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(channel.auto_sync_enabled);
    const [autoQueueEnabled, setAutoQueueEnabled] = useState(channel.auto_queue_enabled);
    const [autoFinalizeEnabled, setAutoFinalizeEnabled] = useState(channel.auto_finalize_enabled);
    const [autoFinalizeMinConfidence, setAutoFinalizeMinConfidence] = useState(
        channel.auto_finalize_min_confidence ?? 0.85,
    );
    const [levelInferenceEnabled, setLevelInferenceEnabled] = useState(
        channel.level_inference_enabled ?? false,
    );

    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sync form if channel prop changes
    useEffect(() => {
        setDefaultLevel(channel.default_lesson_level ?? "");
        setMinDurMin(
            channel.min_duration_sec !== null
                ? String(Math.round(channel.min_duration_sec / 60))
                : "",
        );
        setMaxDurMin(
            channel.max_duration_sec !== null
                ? String(Math.round(channel.max_duration_sec / 60))
                : "",
        );
        setAutoSyncEnabled(channel.auto_sync_enabled);
        setAutoQueueEnabled(channel.auto_queue_enabled);
        setAutoFinalizeEnabled(channel.auto_finalize_enabled);
        setAutoFinalizeMinConfidence(channel.auto_finalize_min_confidence ?? 0.85);
        setLevelInferenceEnabled(channel.level_inference_enabled ?? false);
    }, [channel]);

    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg(null);
        setError(null);

        try {
            const payload: Parameters<typeof api.updateChannel>[1] = {};

            if (defaultLevel) payload.default_lesson_level = defaultLevel;

            const minVal = Number.parseFloat(minDurMin);
            payload.min_duration_sec =
                minDurMin !== "" && !Number.isNaN(minVal) ? Math.round(minVal * 60) : undefined;

            const maxVal = Number.parseFloat(maxDurMin);
            payload.max_duration_sec =
                maxDurMin !== "" && !Number.isNaN(maxVal) ? Math.round(maxVal * 60) : undefined;

            payload.auto_sync_enabled = autoSyncEnabled;
            payload.auto_queue_enabled = autoQueueEnabled;
            payload.auto_finalize_enabled = autoFinalizeEnabled;
            payload.auto_finalize_min_confidence = autoFinalizeMinConfidence;
            payload.level_inference_enabled = levelInferenceEnabled;

            await api.updateChannel(channel.id, payload);
            await reloadChannel();
            setSuccessMsg("Settings saved successfully.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold text-slate-900">Channel Settings</h2>

            {successMsg && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4 text-sm">
                {/* DEFAULT LEVEL */}
                <div>
                    <label
                        htmlFor="settings-level"
                        className="block text-xs font-medium text-slate-600 mb-1"
                    >
                        Default Lesson Level
                    </label>
                    <select
                        id="settings-level"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={defaultLevel}
                        onChange={(e) => setDefaultLevel(e.target.value)}
                        disabled={saving}
                    >
                        <option value="">No default</option>
                        {LEVELS.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>
                </div>

                {/* MIN / MAX DURATION */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="settings-min-dur"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
                            Min Duration (minutes)
                        </label>
                        <input
                            id="settings-min-dur"
                            type="number"
                            min={0}
                            step={0.5}
                            value={minDurMin}
                            onChange={(e) => setMinDurMin(e.target.value)}
                            placeholder="e.g. 2"
                            disabled={saving}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="settings-max-dur"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
                            Max Duration (minutes)
                        </label>
                        <input
                            id="settings-max-dur"
                            type="number"
                            min={0}
                            step={0.5}
                            value={maxDurMin}
                            onChange={(e) => setMaxDurMin(e.target.value)}
                            placeholder="e.g. 15"
                            disabled={saving}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* AUTO-SYNC TOGGLE */}
                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Auto-sync new videos</p>
                        <p className="text-xs text-slate-400">
                            Automatically check for new videos every 6 hours
                        </p>
                    </div>
                    <Toggle
                        checked={autoSyncEnabled}
                        onChange={setAutoSyncEnabled}
                        disabled={saving}
                    />
                </div>

                {/* AUTO-QUEUE TOGGLE */}
                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Auto-queue new videos</p>
                        <p className="text-xs text-slate-400">
                            Automatically queue new videos that match duration filters for
                            processing
                        </p>
                        {channel.last_auto_queued_at && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                Last queued: {formatRelativeTime(channel.last_auto_queued_at)}
                            </p>
                        )}
                        {!channel.last_auto_queued_at && (
                            <p className="text-xs text-slate-400 mt-0.5">Last queued: Never</p>
                        )}
                    </div>
                    <Toggle
                        checked={autoQueueEnabled}
                        onChange={setAutoQueueEnabled}
                        disabled={saving || !autoSyncEnabled}
                    />
                </div>

                {/* AUTO-FINALIZATION SECTION */}
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap uppercase tracking-wide">
                            Auto-finalization
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* AUTO-FINALIZE TOGGLE */}
                    <div className="flex items-start justify-between py-3 border-t border-slate-100">
                        <div className="flex-1 pr-4">
                            <p className="text-sm font-medium text-slate-700">Auto-finalize</p>
                            <p className="text-xs text-slate-400">
                                Skip manual review for high-confidence alignments
                            </p>
                            {autoFinalizeEnabled && (
                                <div className="mt-3 space-y-1">
                                    <label
                                        htmlFor="confidence-slider"
                                        className="text-sm text-slate-600"
                                    >
                                        Minimum confidence:{" "}
                                        <span className="font-semibold">
                                            {autoFinalizeMinConfidence.toFixed(2)}
                                        </span>
                                    </label>
                                    <input
                                        id="confidence-slider"
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={autoFinalizeMinConfidence}
                                        onChange={(e) =>
                                            setAutoFinalizeMinConfidence(Number(e.target.value))
                                        }
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                        <Toggle
                            checked={autoFinalizeEnabled}
                            onChange={setAutoFinalizeEnabled}
                            disabled={saving}
                        />
                    </div>

                    {/* LEVEL INFERENCE TOGGLE */}
                    <div className="flex items-center justify-between py-3 border-t border-slate-100">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Level inference</p>
                            <p className="text-xs text-slate-400">
                                Use AI to suggest lesson level from video metadata
                            </p>
                        </div>
                        <Toggle
                            checked={levelInferenceEnabled}
                            onChange={setLevelInferenceEnabled}
                            disabled={saving}
                        />
                    </div>
                </div>
            </div>

            <Btn.Primary onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
            </Btn.Primary>
        </div>
    );
};

export default YouTubeSettingsTab;
