
export const Skeleton = ({ className = "" }) => (
    <div
        className={`
      animate-pulse bg-slate-200/60 
      rounded-card ${className}
    `}
    />
);
