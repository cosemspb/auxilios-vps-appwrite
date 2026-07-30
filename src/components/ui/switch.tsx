'use client'

import * as React from 'react'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onCheckedChange) {
                onCheckedChange(e.target.checked)
            }
        }

        const trackStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            height: 24,
            width: 44,
            flexShrink: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderRadius: 9999,
            border: '2px solid transparent',
            backgroundColor: checked ? '#6b7280' : '#e5e7eb',
            transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: disabled ? 0.5 : 1,
            position: 'relative',
        }

        const knobStyle: React.CSSProperties = {
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: 9999,
            backgroundColor: 'white',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
        }

        return (
            <label
                className={className}
                style={trackStyle}
            >
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        padding: 0,
                        margin: -1,
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0,
                    }}
                    {...props}
                />
                <span style={knobStyle} />
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
