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
        ${className}
      `}
        >
            {children}
        </button>
    ),
};
