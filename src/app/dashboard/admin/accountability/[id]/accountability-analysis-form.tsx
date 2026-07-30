'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle } from 'lucide-react'
import { approveAccountability, rejectAccountability } from '@/app/actions/admin-actions'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'

interface AccountabilityAnalysisFormProps {
    accountabilityId: string
    requestSituacao?: string
}

const STATUS_FINALIZADOS = ['paga_comprovada', 'concluida']

export function AccountabilityAnalysisForm({ accountabilityId, requestSituacao }: AccountabilityAnalysisFormProps) {
    const router = useRouter()
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [motivoRecusa, setMotivoRecusa] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mounted, setMounted] = useState(false)

    const [paymentPending, setPaymentPending] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleApprove = async () => {
        setLoading(true)
        setError('')

        const result = await approveAccountability(accountabilityId)

        if (result.success) {
            setPaymentPending('paymentPending' in result ? (result as any).paymentPending : false)
            setShowSuccessModal(true)
            setLoading(false)
        } else {
            setError(result.message || 'Erro ao aprovar prestação de contas')
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!motivoRecusa.trim()) {
            setError('Por favor, informe as correções necessárias')
            return
        }

        setLoading(true)
        setError('')

        const result = await rejectAccountability(accountabilityId, motivoRecusa)

        if (result.success) {
            router.push('/dashboard')
            router.refresh()
        } else {
            setError(result.message || 'Erro ao rejeitar prestação de contas')
            setLoading(false)
        }
    }

    const closeModal = () => {
        setShowRejectModal(false)
        setMotivoRecusa('')
        setError('')
    }

    const handleGoToDashboard = () => {
        setShowSuccessModal(false)
        router.push('/dashboard')
        router.refresh()
    }

    const successModalContent = showSuccessModal ? (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px'
            }}
        >
            <div
                style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '32px',
                    maxWidth: '480px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}
            >
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}
                >
                    <CheckCircle style={{ width: '36px', height: '36px', color: '#16a34a' }} />
                </div>
                <h3 style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '12px'
                }}>
                    Prestação de Contas Aprovada!
                </h3>
                <p style={{
                    fontSize: '0.95rem',
                    color: '#4b5563',
                    marginBottom: '24px',
                    lineHeight: '1.5'
                }}>
                    {paymentPending
                        ? 'A prestação de contas foi aprovada. Registre o pagamento para concluir o processo.'
                        : 'A prestação de contas foi aprovada com sucesso. O processo está concluído.'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={handleGoToDashboard}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Voltar para o Dashboard
                    </button>
                </div>
            </div>
        </div>
    ) : null

    const modalContent = showRejectModal ? (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) closeModal()
            }}
        >
            <div
                style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e2e8f0'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '16px'
                }}>
                    Correções Necessárias
                </h3>
                <p style={{
                    fontSize: '0.95rem',
                    color: '#4b5563',
                    marginBottom: '16px'
                }}>
                    Informe ao solicitante quais correções precisam ser feitas na prestação de contas:
                </p>
                <textarea
                    value={motivoRecusa}
                    onChange={(e) => setMotivoRecusa(e.target.value)}
                    placeholder="Descreva as correções necessárias..."
                    rows={6}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        marginBottom: '16px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                    }}
                />
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'white',
                            color: '#374151',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleReject}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Processando...' : 'Confirmar Rejeição'}
                    </button>
                </div>
            </div>
        </div>
    ) : null

    return (
        <>
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Decisão</h2>

                {error && !showRejectModal && (
                    <Alert variant="destructive" className="mb-4">
                        {error}
                    </Alert>
                )}

                {requestSituacao && STATUS_FINALIZADOS.includes(requestSituacao) ? (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-900">Prestação de contas já finalizada</p>
                            <p className="text-xs text-blue-700">Esta solicitação já foi concluída. Não são necessárias ações adicionais.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            onClick={handleApprove}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? 'Processando...' : 'Aprovar Prestação de Contas'}
                        </Button>
                        <Button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                setShowRejectModal(true)
                            }}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Rejeitar e Solicitar Correções
                        </Button>
                    </div>
                )}
            </Card>

            {mounted && createPortal(<>{successModalContent}{modalContent}</>, document.body)}
        </>
    )
}
