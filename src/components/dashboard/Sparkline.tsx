import React, { useMemo } from "react";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    strokeClassName?: string;
    strokeWidth?: number;
    ariaLabel?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
    data,
    width = 220,
    height = 44,
    strokeClassName = "stroke-brand",
    strokeWidth = 2,
    ariaLabel = "Trend",
}) => {
    const points = useMemo(() => {
        const values = data.filter((n) => Number.isFinite(n));
        if (values.length < 2) return "";

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = Math.max(1e-9, max - min);

        return values
            .map((value, index) => {
                const x = (index / (values.length - 1)) * (width - 2) + 1;
                const y = (1 - (value - min) / range) * (height - 2) + 1;
                return `${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(" ");
    }, [data, height, width]);

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={ariaLabel}
            className="block"
        >
            <polyline
                points={points}
                fill="none"
                className={strokeClassName}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Sparkline;

