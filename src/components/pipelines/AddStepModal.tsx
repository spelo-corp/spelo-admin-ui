import { X } from "lucide-react";
import { useState } from "react";
import { STEP_KEYS } from "../../types/pipeline";

interface AddStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (stepKey: string) => Promise<void>;
}

export function AddStepModal({ isOpen, onClose, onAdd }: AddStepModalProps) {
    const [selectedKey, setSelectedKey] = useState<string>(STEP_KEYS[0]);
    const [customKey, setCustomKey] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalKey = selectedKey === "custom" ? customKey.trim() : selectedKey;
        if (!finalKey) return;

        try {
            setIsSubmitting(true);
            await onAdd(finalKey);
            // reset state for next time
            setSelectedKey(STEP_KEYS[0]);
            setCustomKey("");
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Add Pipeline Step</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5">
                    <div className="mb-4">
                        <label className="block text-slate-700 text-sm font-medium mb-1.5">
                            Select Step Key
                        </label>
                        <select
                            value={selectedKey}
                            onChange={(e) => setSelectedKey(e.target.value)}
                            className="w-full border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 text-slate-900"
                        >
                            {STEP_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                            <option value="custom">-- Custom Step --</option>
                        </select>
                    </div>

                    {selectedKey === "custom" && (
                        <div className="mb-6 animate-in slide-in-from-top-2 duration-150">
                            <label className="block text-slate-700 text-sm font-medium mb-1.5">
                                Custom Step Key
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="my_custom_step"
                                value={customKey}
                                onChange={(e) => setCustomKey(e.target.value)}
                                className="w-full border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 font-mono text-sm"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isSubmitting || (selectedKey === "custom" && !customKey.trim())
                            }
                            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSubmitting ? "Adding..." : "Add Step"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
