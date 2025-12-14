import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface RouteErrorBoundaryProps {
    children: ReactNode;
    routeName?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Route-specific error boundary that allows recovery without full page reload.
 * Useful for wrapping individual route components.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
    constructor(props: RouteErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(
            `Error in route ${this.props.routeName || "unknown"}:`,
            error,
            errorInfo
        );
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}
