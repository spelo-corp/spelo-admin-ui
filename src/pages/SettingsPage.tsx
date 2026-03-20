import { CheckCircle2, Upload, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { settingsApi } from "../api/settings";
import PageHeader from "../components/common/PageHeader";

interface CookiesStatus {
    configured: boolean;
    modified?: string;
    size?: number;
}

const SettingsPage: React.FC = () => {
    const [status, setStatus] = useState<CookiesStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
        null,
    );
    const fileRef = useRef<HTMLInputElement>(null);
    const fetched = useRef(false);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const s = await settingsApi.getYouTubeCookiesStatus();
            setStatus(s);
        } catch {
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch status on first render
    if (!fetched.current) {
        fetched.current = true;
        fetchStatus();
    }

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);
        try {
            await settingsApi.uploadYouTubeCookies(file);
            setMessage({ type: "success", text: "YouTube cookies uploaded successfully." });
            if (fileRef.current) fileRef.current.value = "";
            await fetchStatus();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Upload failed";
            setMessage({ type: "error", text: msg });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader title="Settings" description="Manage system configuration." />

            {/* YouTube Cookies Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm max-w-2xl">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">YouTube Cookies</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Upload a Netscape-format <code>cookies.txt</code> file exported from a
                        browser with an authenticated YouTube session. This is required for yt-dlp
                        to download YouTube audio.
                    </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">Status:</span>
                        {loading ? (
                            <span className="text-sm text-slate-400">Checking…</span>
                        ) : status?.configured ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Configured
                                {status.modified && (
                                    <span className="text-slate-400 font-normal ml-1">
                                        · Updated{" "}
                                        {new Date(status.modified).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-red-500 font-medium">
                                <XCircle className="w-4 h-4" />
                                Not configured
                            </span>
                        )}
                    </div>

                    {/* Upload */}
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".txt"
                            id="cookies-file-input"
                            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20 file:cursor-pointer file:transition-colors"
                        />
                        <button
                            id="upload-cookies-btn"
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-4 h-4" />
                            {uploading ? "Uploading…" : "Upload"}
                        </button>
                    </div>

                    {/* Feedback */}
                    {message && (
                        <div
                            className={`rounded-lg px-4 py-3 text-sm ${
                                message.type === "success"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Help */}
                    <details className="text-sm text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-700 font-medium">
                            How to export cookies
                        </summary>
                        <ol className="mt-2 ml-4 list-decimal space-y-1 text-slate-500">
                            <li>
                                Install{" "}
                                <a
                                    href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand underline"
                                >
                                    Get cookies.txt LOCALLY
                                </a>{" "}
                                in Chrome
                            </li>
                            <li>Go to youtube.com and make sure you're logged in</li>
                            <li>Click the extension icon and export cookies</li>
                            <li>Upload the downloaded file here</li>
                        </ol>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
