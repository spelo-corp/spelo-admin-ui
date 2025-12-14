import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => {
    return (
        <input
            {...props}
            ref={ref}
            className={`
                w-full px-3 py-2 rounded-full bg-white border border-slate-200
                text-sm text-slate-700 focus:ring-2 focus:ring-brand/50
                ${className}
            `}
        />
    );
});

Input.displayName = "Input";
