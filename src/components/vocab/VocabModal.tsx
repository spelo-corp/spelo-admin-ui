import React, { useEffect, useState } from "react";

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
        if (initialData) {
            setForm(initialData);
        } else {
            setForm({
                word: "",
                ipa: "",
                definition: "",
                translation: "",
                example: "",
            });
        }
    }, [initialData, show]);

    if (!show) return null;

    const title = mode === "create" ? "Add New Word" : "Edit Word";
    const buttonLabel = mode === "create" ? "Create Word" : "Save Changes";

    const handleChange = (key: keyof VocabFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const submit = () => {
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[450px] rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>

                <div className="flex flex-col gap-3">

                    <input
                        className="input"
                        placeholder="Word"
                        value={form.word}
                        onChange={(e) => handleChange("word", e.target.value)}
                    />

                    <input
                        className="input"
                        placeholder="IPA (/həˈloʊ/)"
                        value={form.ipa}
                        onChange={(e) => handleChange("ipa", e.target.value)}
                    />

                    <input
                        className="input"
                        placeholder="Vietnamese Meaning"
                        value={form.translation}
                        onChange={(e) => handleChange("translation", e.target.value)}
                    />

                    <textarea
                        className="input"
                        placeholder="Definition (English)"
                        value={form.definition}
                        onChange={(e) => handleChange("definition", e.target.value)}
                    />

                    <textarea
                        className="input"
                        placeholder="Example Sentence"
                        value={form.example}
                        onChange={(e) => handleChange("example", e.target.value)}
                    />

                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={submit}
                        className="btn-primary px-4 py-2 rounded-lg"
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VocabModal;
