import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AudioFile } from "../types";

import {
    FileAudio2,
    Search,
    Play,
    Trash2,
    Plus,
    Music,
    Loader2,
} from "lucide-react";
import {Input} from "../components/ui/Input.tsx";
import { Btn } from "../components/ui/Btn.tsx";

const AudioFilesPage: React.FC = () => {
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    // upload form
    const [url, setUrl] = useState("");
    const [fileName, setFileName] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.getAudioFiles();
            if (res.success) setAudioFiles(res.files);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = audioFiles.filter((f) =>
        f.file_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleUpload = async () => {
        if (!url.trim() || !fileName.trim()) return;

        await api.uploadAudioFile({
            url,
            file_name: fileName,
        });

        setModalOpen(false);
        setUrl("");
        setFileName("");
        await loadData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this audio file?")) return;
        await api.deleteAudioFile(id);
        await loadData();
    };

    return (
        <div className="space-y-10">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold text-slate-900">
                    Audio Files
                </h1>

                <Btn.Primary onClick={() => setModalOpen(true)}>
                    <Plus className="w-4 h-4" /> Upload Audio
                </Btn.Primary>
            </div>

            {/* SEARCH BAR */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <Input
                    placeholder="Search audio files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* AUDIO LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading audio files…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-14 space-y-3">
                        <Music className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-medium text-slate-700">No audio files found.</p>
                        <p className="text-sm text-slate-500">
                            Try uploading a new audio file to get started.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filtered.map((file) => (
                            <div
                                key={file.id}
                                className="rounded-card border border-slate-100 shadow-sm p-4 flex flex-col gap-3 bg-white"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                                        <FileAudio2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 text-sm">
                                            {file.file_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            ID #{file.id}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex gap-2 mt-auto">
                                    <button
                                        className="
                      flex-1 px-3 py-1.5 rounded-full border text-xs
                      text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1
                    "
                                        onClick={() => window.open(file.url, "_blank")}
                                    >
                                        <Play className="w-4 h-4" /> Preview
                                    </button>

                                    <button
                                        className="
                      flex-1 px-3 py-1.5 rounded-full border text-xs
                      border-rose-500 text-rose-600 hover:bg-rose-50
                      flex items-center justify-center gap-1
                    "
                                        onClick={() => handleDelete(file.id)}
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* UPLOAD MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-card shadow-shell w-full max-w-md p-6">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Upload New Audio
                            </h2>
                            <button onClick={() => setModalOpen(false)}>✕</button>
                        </div>

                        {/* Form */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    File Name *
                                </label>
                                <Input
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder="example_audio.mp3"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    File URL *
                                </label>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/audio.mp3"
                                />
                            </div>

                            <p className="text-xs text-slate-500">
                                Upload from local file will be supported (R2 integration).
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary onClick={() => setModalOpen(false)}>
                                Cancel
                            </Btn.Secondary>
                            <Btn.Primary onClick={handleUpload}>
                                Upload
                            </Btn.Primary>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioFilesPage;
