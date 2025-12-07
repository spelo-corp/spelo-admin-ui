import React, { useEffect, useState } from "react";
import { X, BookOpen } from "lucide-react";

export interface VocabFormData {
    word: string;
    ipa: string;
    definition: string;
    translation: string;
    example: string;
}

interface VocabModalProps {
    show: boolean;
    mode: "create" | "edit";
    initialData?: VocabFormData | null;
    onClose: () => void;
    onSubmit: (data: VocabFormData) => void;
}

const VocabModal: React.FC<VocabModalProps> = ({
                                                   show,
                                                   mode,
                                                   initialData,
                                                   onClose,
                                                   onSubmit,
                                               }) => {
    const [form, setForm] = useState<VocabFormData>({
        word: "",
        ipa: "",
        definition: "",
        translation: "",
        example: "",
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (initialData) setForm(initialData);
        else
            setForm({
                word: "",
                ipa: "",
                definition: "",
                translation: "",
                example: "",
            });
    }, [initialData, show]);

    if (!show) return null;

    const title = mode === "create" ? "Add New Word" : "Edit Word";
    const buttonLabel = mode === "create" ? "Create Word" : "Save Changes";

    const handleChange = (key: keyof VocabFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fadeIn">
            <div className="bg-white w-[480px] rounded-2xl shadow-2xl p-6 relative animate-scaleIn">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* HEADER */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="bg-brand/10 text-brand p-2 rounded-xl">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                </div>

                {/* FORM */}
                <div className="flex flex-col gap-4">

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 mb-1">Word</label>
                        <input
                            className="input"
                            value={form.word}
                            onChange={(e) => handleChange("word", e.target.value)}
                            placeholder="hello, appointment, insurance..."
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 mb-1">IPA</label>
                        <input
                            className="input"
                            value={form.ipa}
                            onChange={(e) => handleChange("ipa", e.target.value)}
                            placeholder="/həˈloʊ/ (US)"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 mb-1">
                            Vietnamese Meaning
                        </label>
                        <input
                            className="input"
                            value={form.translation}
                            onChange={(e) => handleChange("translation", e.target.value)}
                            placeholder="xin chào, cuộc hẹn..."
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 mb-1">Definition</label>
                        <textarea
                            className="input h-20"
                            value={form.definition}
                            onChange={(e) => handleChange("definition", e.target.value)}
                            placeholder="A greeting used when meeting someone..."
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 mb-1">Example</label>
                        <textarea
                            className="input h-20"
                            value={form.example}
                            onChange={(e) => handleChange("example", e.target.value)}
                            placeholder="Hello! How may I help you?"
                        />
                    </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-5 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium"
                        onClick={() => onSubmit(form)}
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>

            {/* ANIMATIONS */}
            <style>{`
                .animate-fadeIn {
                    animation: fadeIn 0.15s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .animate-scaleIn {
                    animation: scaleIn 0.15s ease-out;
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default VocabModal;
