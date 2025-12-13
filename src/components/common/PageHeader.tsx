import React from "react";
import type { ReactNode } from "react";

interface PageHeaderProps {
    badge?: ReactNode;
    title: ReactNode;
    titleAddon?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
    gradientClassName?: string;
}

const DEFAULT_GRADIENT = "bg-gradient-to-r from-brand via-brand-dark to-emerald-700";

const PageHeader: React.FC<PageHeaderProps> = ({
    badge,
    title,
    titleAddon,
    description,
    actions,
    children,
    className = "",
    gradientClassName = DEFAULT_GRADIENT,
}) => {
    return (
        <div
            className={`
                relative overflow-hidden rounded-shell border border-white/10
                ${gradientClassName}
                text-white shadow-shell
                ${className}
            `}
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-28 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute top-16 right-[-90px] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_38%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.14),transparent_35%)]" />
            </div>

            <div className="relative px-6 py-6 md:px-8 md:py-7 space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2 max-w-3xl">
                        {badge ? <div>{badge}</div> : null}
                        <h1 className="text-3xl font-semibold">
                            <span className="inline-flex flex-wrap items-center gap-3">
                                {title}
                                {titleAddon}
                            </span>
                        </h1>
                        {description ? (
                            <p className="text-sm text-white/80">{description}</p>
                        ) : null}
                    </div>

                    {actions ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {actions}
                        </div>
                    ) : null}
                </div>

                {children ? <div>{children}</div> : null}
            </div>
        </div>
    );
};

export default PageHeader;
