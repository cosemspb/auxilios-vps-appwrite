import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'danger' | 'warning';
    isLoading?: boolean;
}

export function Button({
    children,
    className = '',
    variant = 'primary',
    isLoading,
    disabled,
    ...props
}: ButtonProps) {
    const variantClass = {
        destructive: 'bg-error text-white',
        outline: 'btn-outline',
        ghost: 'bg-transparent hover:bg-gray-100',
        primary: 'btn-primary',
        success: 'btn-success',
        danger: 'btn-danger',
        warning: 'btn-warning',
    }[variant];

    return (
        <button
            className={`btn ${variantClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? 'Carregando...' : children}
        </button>
    );
}
