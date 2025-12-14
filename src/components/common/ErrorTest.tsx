import React from "react";

/**
 * Test component to verify error boundary functionality.
 * This component intentionally throws an error when rendered.
 * 
 * Usage: Import and add to a route to test error boundaries.
 * Example: <Route path="/error-test" element={<ErrorTest />} />
 */

interface ErrorTestProps {
    delay?: number;
}

export const ErrorTest: React.FC<ErrorTestProps> = ({ delay = 0 }) => {
    if (delay > 0) {
        setTimeout(() => {
            throw new Error("Delayed test error thrown intentionally");
        }, delay);
    } else {
        throw new Error("Test error thrown intentionally");
    }

    return null;
};

/**
 * Component that throws an error when a button is clicked.
 * Useful for testing error boundaries in interactive scenarios.
 */
export const ErrorTestButton: React.FC = () => {
    const [shouldError, setShouldError] = React.useState(false);

    if (shouldError) {
        throw new Error("Button-triggered test error");
    }

    return (
        <div className="p-8">
            <div className="max-w-md mx-auto text-center">
                <h2 className="text-2xl font-semibold mb-4">Error Boundary Test</h2>
                <p className="text-slate-600 mb-6">
                    Click the button below to trigger an error and test the error boundary.
                </p>
                <button
                    onClick={() => setShouldError(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                >
                    Trigger Error
                </button>
            </div>
        </div>
    );
};

export default ErrorTestButton;
