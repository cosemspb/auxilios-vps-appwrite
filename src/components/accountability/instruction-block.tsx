'use client'

import { Info } from 'lucide-react'

interface InstructionBlockProps {
    title: string
    steps: string[]
}

export function InstructionBlock({ title, steps }: InstructionBlockProps) {
    return (
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 space-y-3">
            <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-700" />
                <h4 className="font-semibold text-blue-900">{title}</h4>
            </div>
            <ol className="space-y-2 text-sm text-blue-800 leading-relaxed" style={{ paddingLeft: '1.75rem', listStyle: 'none' }}>
                {steps.map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <span className="font-semibold shrink-0 w-1-4rem">{i + 1}.</span>
                        <span>{text}</span>
                    </li>
                ))}
            </ol>
        </div>
    )
}
