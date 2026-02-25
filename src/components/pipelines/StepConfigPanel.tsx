import { useEffect, useState } from "react";
import type { CreatePipelineStepRequest, PipelineStepDTO } from "../../types/pipeline";

interface StepConfigPanelProps {
    step: PipelineStepDTO;
    onSave: (stepId: number, data: CreatePipelineStepRequest) => Promise<void>;
}

export function StepConfigPanel({ step, onSave }: StepConfigPanelProps) {
    const [retryCount, setRetryCount] = useState(step.retryCount);
    const [retryBackoffMs, setRetryBackoffMs] = useState(step.retryBackoffMs);
    const [failureMode, setFailureMode] = useState<"ABORT" | "SKIP" | "RETRY">(step.failureMode);
    const [skipOnFail, setSkipOnFail] = useState(step.skipOnFail);
    const [timeoutMs, setTimeoutMs] = useState<string>(
        step.timeoutMs ? String(step.timeoutMs) : "",
    );
    const [conditionExpression, setConditionExpression] = useState(step.conditionExpression || "");
    const [isParallel, setIsParallel] = useState(step.isParallel);

    // JSON Config State
    const [configText, setConfigText] = useState("");
    const [configError, setConfigError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state when step changes
    useEffect(() => {
        setRetryCount(step.retryCount);
        setRetryBackoffMs(step.retryBackoffMs);
        setFailureMode(step.failureMode);
        setSkipOnFail(step.skipOnFail);
        setTimeoutMs(step.timeoutMs ? String(step.timeoutMs) : "");
        setConditionExpression(step.conditionExpression || "");
        setIsParallel(step.isParallel);

        if (step.config) {
            try {
                // Try to pretty print if it's valid JSON
                const parsed = JSON.parse(step.config);
                setConfigText(JSON.stringify(parsed, null, 2));
            } catch (_e) {
                setConfigText(step.config);
            }
        } else {
            setConfigText("");
        }
        setConfigError(null);
    }, [step]);

    const handleSave = async () => {
        let validConfig: string | undefined;

        if (configText.trim()) {
            try {
                // Validate JSON before saving
                JSON.parse(configText);
                // Minify for storage or let backend handle it, we'll send compact JSON
                validConfig = JSON.stringify(JSON.parse(configText));
                setConfigError(null);
            } catch (_e) {
                setConfigError("Invalid JSON configuration");
                return;
            }
        } else {
            validConfig = undefined; // backend expects string or null/undefined
        }

        const payload: CreatePipelineStepRequest = {
            stepKey: step.stepKey,
            sequence: step.sequence,
            config: validConfig,
            retryCount,
            retryBackoffMs,
            failureMode,
            skipOnFail,
            timeoutMs: timeoutMs.trim() ? Number(timeoutMs) : null,
            conditionExpression: conditionExpression.trim() ? conditionExpression.trim() : null,
            isParallel,
        };

        try {
            setIsSaving(true);
            await onSave(step.id, payload);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="ml-9 mt-2 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-inner text-sm relative">
            <div className="absolute top-0 -left-6 bottom-0 w-px bg-slate-200" />
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-slate-700 font-medium mb-1 text-xs">
                        Failure Mode
                    </label>
                    <select
                        value={failureMode}
                        onChange={(e) =>
                            setFailureMode(e.target.value as "ABORT" | "SKIP" | "RETRY")
                        }
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 bg-white"
                    >
                        <option value="ABORT">ABORT</option>
                        <option value="SKIP">SKIP</option>
                        <option value="RETRY">RETRY</option>
                    </select>
                </div>
                <div>
                    <label className="block text-slate-700 font-medium mb-1 text-xs">
                        Retry Count
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={retryCount}
                        onChange={(e) => setRetryCount(Number(e.target.value))}
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-slate-700 font-medium mb-1 text-xs">
                        Retry Backoff (ms)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={retryBackoffMs}
                        onChange={(e) => setRetryBackoffMs(Number(e.target.value))}
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-slate-700 font-medium mb-1 text-xs">
                        Timeout (ms)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Unlimited"
                        value={timeoutMs}
                        onChange={(e) => setTimeoutMs(e.target.value)}
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 bg-white placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-slate-700 font-medium mb-1 text-xs">
                    Condition Expression (SpEL)
                </label>
                <input
                    type="text"
                    placeholder="e.g. #job.type == 'YOUTUBE_ALIGN'"
                    value={conditionExpression}
                    onChange={(e) => setConditionExpression(e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 font-mono bg-white placeholder:text-slate-300"
                />
            </div>

            <div className="flex items-center gap-6 mb-4 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={isParallel}
                        onChange={(e) => setIsParallel(e.target.checked)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900 transition-colors">
                        Run in parallel
                    </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={skipOnFail}
                        onChange={(e) => setSkipOnFail(e.target.checked)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900 transition-colors">
                        Skip on fail
                    </span>
                </label>
            </div>

            <div className="mb-4">
                <label className="flex justify-between items-end mb-1">
                    <span className="block text-slate-700 font-medium text-xs">
                        Step Config (JSON)
                    </span>
                    {configError && (
                        <span className="text-red-500 font-medium text-xs bg-red-50 px-2 py-0.5 rounded">
                            {configError}
                        </span>
                    )}
                </label>
                <textarea
                    rows={6}
                    value={configText}
                    onChange={(e) => {
                        setConfigText(e.target.value);
                        if (configError) setConfigError(null);
                    }}
                    placeholder="{}"
                    className={`w-full rounded-md shadow-sm font-mono text-sm bg-slate-900 text-slate-50 placeholder:text-slate-600 ${
                        configError
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 ring-1 ring-red-400"
                            : "border-slate-800 focus:border-brand focus:ring-brand/30"
                    }`}
                    spellCheck={false}
                />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/60 mt-2">
                <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
                >
                    {isSaving ? "Saving..." : "Save Step Config"}
                </button>
            </div>
        </div>
    );
}
