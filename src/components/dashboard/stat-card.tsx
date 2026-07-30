import { memo } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    color?: string
    bgColor?: string
    bgColorHex?: string
    iconColorHex?: string
    rowSpan?: number
    colSpan?: number
    className?: string
}

export const StatCard = memo(function StatCard({ title, value, icon: Icon, iconColorHex, rowSpan, colSpan, className }: StatCardProps) {
    const iconBg = iconColorHex ? `${iconColorHex}1a` : '#f3f4f6'

    return (
            <div
            className={`card p-4 ${rowSpan === 2 ? 'row-span-2' : ''} ${colSpan === 2 ? 'col-span-2' : ''} ${className || ''}`}
            style={{
                gridRow: rowSpan ? `span ${rowSpan}` : undefined,
                gridColumn: colSpan ? `span ${colSpan}` : undefined
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="subheader">{title}</div>
                    <div className="h1">{value}</div>
                </div>
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: iconBg, flexShrink: 0, marginLeft: '0.75rem' }}
                >
                    <Icon className="w-5 h-5" style={{ color: iconColorHex || '#6b7280' }} />
                </div>
            </div>
        </div>
    )
})
