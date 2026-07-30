'use client'

import { memo, ReactNode } from 'react'

interface TableRowProps {
    children: ReactNode
    className?: string
    index: number
}

export const TableRow = memo(function TableRow({ children, className = '', index }: TableRowProps) {
    return (
        <tr
            className={`${className} transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
        >
            {children}
        </tr>
    )
})
