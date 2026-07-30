'use client'

import { AlertCircle, FileText } from 'lucide-react'
import Link from 'next/link'

interface PrestacaoConta {
    motivo_recusa?: string
}

interface RectificationRequest {
    id: string
    protocolo?: string | null
    nome_evento: string
    prestacao_contas?: PrestacaoConta[]
}

interface RectificationAlertProps {
    requests: RectificationRequest[]
}

export function RectificationAlert({ requests }: RectificationAlertProps) {
    if (!requests?.length) return null

    return (
        <div
            className="rounded-xl p-5"
            style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '2px solid #f59e0b',
                boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2)'
            }}
        >
            <div className="inline-flex gap-4" style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{
                        background: '#f59e0b',
                        width: '48px',
                        height: '48px',
                        minWidth: '48px'
                    }}
                >
                    <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <div style={{ flex: 1 }}>
                    <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: '#92400e' }}
                    >
                        Atenção: Correções Pendentes
                    </h3>
                    <p className="mb-3" style={{ color: '#b45309' }}>
                        Você possui {requests.length} prestação(ões) de contas que precisa(m) de correção.
                    </p>
                    <div className="space-y-2">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="rounded-lg px-4 py-3"
                                style={{ background: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium" style={{ color: '#1f2937' }}>
                                            {req.nome_evento}
                                        </span>
                                        <span className="ml-3 text-sm font-mono" style={{ color: '#6b7280' }}>
                                            ({req.protocolo || req.id.slice(0, 8)})
                                        </span>
                                    </div>
                                    <Link
                                        href={`/dashboard/accountability/${req.id}`}
                                        className="btn btn-warning no-underline inline-flex items-center gap-1.5 shrink-0"
                                        style={{ color: '#fff' }}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Corrigir
                                    </Link>
                                </div>
                                {req.prestacao_contas?.[0]?.motivo_recusa && (
                                    <div
                                        className="mt-2 px-3 py-2 rounded-md text-sm"
                                        style={{
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            color: '#991b1b'
                                        }}
                                    >
                                        <strong>Motivo:</strong> {req.prestacao_contas[0].motivo_recusa}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
