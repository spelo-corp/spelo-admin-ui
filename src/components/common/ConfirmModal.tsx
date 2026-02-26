import { AlertTriangle, X } from "lucide-react";
import type React from "react";
import { Btn } from "../ui/Btn";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isConfirming?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false,
    isConfirming = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div
                            className={`p-3 rounded-full flex-shrink-0 ${
                                isDestructive
                                    ? "bg-rose-100 text-rose-600"
                                    : "bg-brand/10 text-brand"
                            }`}
                        >
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                            disabled={isConfirming}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
                    <div className="text-slate-500 text-[15px] leading-relaxed">{description}</div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <Btn.Secondary onClick={onClose} disabled={isConfirming}>
                        {cancelText}
                    </Btn.Secondary>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDestructive
                                ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                                : "bg-brand hover:bg-brand-600 focus:ring-brand"
                        }`}
                    >
                        {isConfirming ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                        ) : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
