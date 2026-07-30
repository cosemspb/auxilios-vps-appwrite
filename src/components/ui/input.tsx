import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="label">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`input ${error ? 'border-error' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-sm text-error mt-1">{error}</span>}
        </div>
    );
}
