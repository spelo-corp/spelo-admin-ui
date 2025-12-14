import React from "react";

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
}

/**
 * Reusable error fallback component for displaying error states
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
    return (
        <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Oops! Something went wrong
                </h2>

                <p className="text-slate-600 mb-4">
                    {error?.message || "An unexpected error occurred"}
                </p>

                {resetError && (
                    <button
                        onClick={resetError}
                        className="bg-brand hover:bg-brand-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Minimal error fallback for inline errors
 */
export const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({ error }) => {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
                <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-900 mb-1">Error</h3>
                    <p className="text-sm text-red-700">
                        {error?.message || "Something went wrong"}
                    </p>
                </div>
            </div>
        </div>
    );
};
