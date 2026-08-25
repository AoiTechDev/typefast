import clsx from 'clsx';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    className?: string;
}

const Button = ({ children, className, ...props }: ButtonProps) => {
    return (
        <button
            {...props}
            className={clsx(`w-full border-[3px] bg-lime border-ink py-5 text-lg font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60`, className)}
        >
            {children}
        </button>
    )
}

export default Button