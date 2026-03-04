import { AlertTriangle, ArrowLeft, FileText, Loader2, UploadCloud } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import PageHeader from "../../components/common/PageHeader";
import { Btn } from "../../components/ui/Btn";

const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / 1024 ** i;
    return `${value.toFixed(1)} ${sizes[i]}`;
};

const BookUploadPage: React.FC = () => {
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleFile = (selected: File | null) => {
        if (!selected) return;
        if (selected.type !== "application/pdf") {
            setError("Only PDF files are supported.");
            return;
        }
        setError(null);
        setFile(selected);
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer?.files?.[0];
        if (dropped) handleFile(dropped);
    };

    const handleSubmit = async () => {
        setError(null);

        if (!file) {
            setError("Please select a PDF file to upload.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.uploadBook(file);
            navigate(`/admin/books/ingest/${res.jobId}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to upload book for processing.");
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                badge={
                    <Link
                        to="/admin/books"
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85 border border-white/15 hover:bg-white/15"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Book Library
                    </Link>
                }
                title="Upload Book"
                description="Upload a PDF to start the book ingestion pipeline."
            />

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    {/* PDF input */}
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">PDF file</h2>

                        <label
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                                ${isDragging ? "border-brand bg-brand-soft" : "border-slate-200 bg-slate-50"}
                            `}
                        >
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                            <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                            <p className="text-sm text-slate-700">
                                Drag & drop your PDF file here or click to browse
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Only PDF files supported</p>
                        </label>

                        {file && (
                            <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-slate-50">
                                <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900 text-sm">
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {formatBytes(file.size)} · PDF
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-xs text-rose-600 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary / Actions */}
                <div className="space-y-4">
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-3">
                        <h3 className="text-base font-semibold text-slate-900">Upload summary</h3>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Upload a PDF book file.</li>
                            <li>• The AI service will extract chapters and sentences.</li>
                            <li>• Processing happens asynchronously in the background.</li>
                        </ul>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Btn.Primary
                            onClick={handleSubmit}
                            className="w-full justify-center"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4" />
                                    Upload and Process
                                </>
                            )}
                        </Btn.Primary>

                        <Link
                            to="/admin/books"
                            className="block text-center text-xs text-slate-500 hover:text-slate-700"
                        >
                            Cancel and go back
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookUploadPage;
