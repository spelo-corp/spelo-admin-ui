import type {ButtonHTMLAttributes, ReactNode} from "react";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    className?: string;
}

export const Btn = {
    Primary: ({ children, className = "", ...props }: BtnProps) => (
        <button
            {...props}
            className={`
            px-4 py-2 rounded-full bg-brand text-white font-medium
            shadow-card hover:bg-brand-dark transition
            flex items-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed
            ${className}
          `}
            >
            {children}
        </button>
    ),

    Secondary: ({ children, className = "", ...props }: BtnProps) => (
        <button
            {...props}
            className={`
        px-4 py-2 rounded-full bg-white border border-slate-200 
        text-slate-700 hover:bg-slate-100 transition
        flex items-center gap-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
        >
            {children}
        </button>
    ),

    HeroPrimary: ({ children, className = "", ...props }: BtnProps) => (
        <button
            {...props}
            className={`
            px-4 py-2 rounded-full bg-white text-slate-900 font-semibold
            shadow-lg shadow-black/10 hover:bg-slate-50 transition
            flex items-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed
            ${className}
          `}
        >
            {children}
        </button>
    ),

    HeroSecondary: ({ children, className = "", ...props }: BtnProps) => (
        <button
            {...props}
            className={`
            px-4 py-2 rounded-full bg-white/10 border border-white/25
            text-white font-semibold hover:bg-white/20 transition
            flex items-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed
            ${className}
          `}
        >
            {children}
        </button>
    ),
};
