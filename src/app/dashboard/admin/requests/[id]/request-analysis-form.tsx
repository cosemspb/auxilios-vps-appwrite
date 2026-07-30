'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/format-utils'
import { Modal } from '@/components/ui/modal'
import { Calendar, Check, ThumbsUp, ThumbsDown, AlertTriangle, XCircle } from 'lucide-react'
import { approveRequest, rejectRequest, registerPayment, preApproveRequest, getUserOpenAccountabilities, cancelRequest, updateRequestFinancialValues } from '@/app/actions/admin-actions'

interface OpenAccountability {
    id: string
    status: string
    protocolo: string
    evento: string
    data_envio: string
}

interface RequestAnalysisFormProps {
    requestId: string
    categoria: string
    categoriaId?: number
    auxiliosTerceiros: Array<{
        tipo: string
        quantidade: number
    }>
    calculatedValues: {
        quantidadeDiarias: number
        valorDiaria: number
        valorDiarias: number
        valorDeslocamento: number
        ajudaCustoExtraordinaria: number
        descontoOutrosAuxilios: number
        valorAPagar: number
    }
    reducaoDiariasAtual?: boolean
    currentStatus?: string
    userPerfil?: number
    usuarioCpf?: string
}

export function RequestAnalysisForm({ requestId, categoria, categoriaId, auxiliosTerceiros, calculatedValues, reducaoDiariasAtual, currentStatus, userPerfil, usuarioCpf }: RequestAnalysisFormProps) {
    const router = useRouter()

    const isRedeMode = userPerfil === 2 && categoriaId === 11 && (currentStatus === 'pendente' || currentStatus === 'retificada')
    const isFinalApprovalMode = userPerfil === 3 && currentStatus === 'pre_aprovada'
    const isLocked = currentStatus !== 'pendente' && currentStatus !== 'pre_aprovada' && currentStatus !== 'retificada'
    const canShowFinancialFields = !isRedeMode
    const isAuthorized = currentStatus === 'autorizada'

    const [reducaoDiarias50, setReducaoDiarias50] = useState(reducaoDiariasAtual || false)
    const [ajudaCusto, setAjudaCusto] = useState(calculatedValues.ajudaCustoExtraordinaria.toFixed(2).replace('.', ','))
    const [desconto, setDesconto] = useState(calculatedValues.descontoOutrosAuxilios.toFixed(2).replace('.', ','))

    const valorDiariasEfetivo = (reducaoDiariasAtual)
        ? calculatedValues.valorDiarias * 0.5
        : calculatedValues.valorDiarias

    const valorInicialAPagar = valorDiariasEfetivo + calculatedValues.valorDeslocamento +
        calculatedValues.ajudaCustoExtraordinaria - calculatedValues.descontoOutrosAuxilios

    const [valorAPagar, setValorAPagar] = useState(Math.max(0, valorInicialAPagar).toFixed(2).replace('.', ','))
    const [observacoes, setObservacoes] = useState('')
    const [motivoRecusa, setMotivoRecusa] = useState('')
    const [showRejectionForm, setShowRejectionForm] = useState(false)
    const [showCancelForm, setShowCancelForm] = useState(false)
    const [motivoCancelamento, setMotivoCancelamento] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
    const [valorPagoConfirmado, setValorPagoConfirmado] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [successType, setSuccessType] = useState<'authorization' | 'payment' | 'update' | null>(null)
    const [saveFeedback, setSaveFeedback] = useState<'idle' | 'saving' | 'saved'>('idle')

    const paymentRef = useRef<HTMLDivElement>(null)

    const [openAccountabilities, setOpenAccountabilities] = useState<OpenAccountability[]>([])
    const [showAccountabilityWarning, setShowAccountabilityWarning] = useState(false)

    useEffect(() => {
        if (showPaymentForm && paymentRef.current) {
            paymentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [showPaymentForm])

    useEffect(() => {
        if (usuarioCpf) {
            getUserOpenAccountabilities(usuarioCpf).then(setOpenAccountabilities)
        }
    }, [usuarioCpf])

    const formatValue = (value: string): string => {
        let cleaned = value.replace(/[^\d,]/g, '')
        const parts = cleaned.split(',')
        if (parts.length > 2) {
            cleaned = parts[0] + ',' + parts.slice(1).join('')
        }
        const [integerPart, decimalPart] = cleaned.split(',')
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger
    }

    const parseValue = (value: string): number => {
        return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
    }

    const formatWithDecimals = (value: string): string => {
        if (!value || value === '') return '0,00'
        const numValue = parseValue(value)
        return formatValue(numValue.toFixed(2).replace('.', ','))
    }

    const getValorDiariasComReducao = (comReducao: boolean) => {
        return comReducao ? calculatedValues.valorDiarias * 0.5 : calculatedValues.valorDiarias
    }

    const recalcularTotal = (ajuda: number, desc: number, comReducao: boolean) => {
        const valorDiarias = getValorDiariasComReducao(comReducao)
        const novoValor = valorDiarias + calculatedValues.valorDeslocamento + ajuda - desc
        setValorAPagar(formatValue(Math.max(0, novoValor).toFixed(2).replace('.', ',')))
    }

    const handleReducaoDiariasChange = (checked: boolean) => {
        setReducaoDiarias50(checked)
        const ajudaNum = parseValue(ajudaCusto)
        const descontoNum = parseValue(desconto)
        recalcularTotal(ajudaNum, descontoNum, checked)
    }

    const handleAjudaCustoChange = (value: string) => {
        const formatted = formatValue(value)
        setAjudaCusto(formatted)
        const ajudaNum = parseValue(formatted)
        const descontoNum = parseValue(desconto)
        recalcularTotal(ajudaNum, descontoNum, reducaoDiarias50)
    }

    const handleAjudaCustoBlur = () => {
        setAjudaCusto(formatWithDecimals(ajudaCusto))
    }

    const handleDescontoChange = (value: string) => {
        const formatted = formatValue(value)
        setDesconto(formatted)
        const ajudaNum = parseValue(ajudaCusto)
        const descontoNum = parseValue(formatted)
        recalcularTotal(ajudaNum, descontoNum, reducaoDiarias50)
    }

    const handleDescontoBlur = () => {
        setDesconto(formatWithDecimals(desconto))
    }

    const handleValorAPagarChange = (value: string) => {
        const formatted = formatValue(value)
        setValorAPagar(formatted)
    }

    const handleValorAPagarBlur = () => {
        setValorAPagar(formatWithDecimals(valorAPagar))
    }

    const handleApprove = async () => {
        if (openAccountabilities.length > 0 && !showAccountabilityWarning) {
            setShowAccountabilityWarning(true)
            return
        }

        setLoading(true)
        setError('')

        if (isRedeMode) {
            const result = await preApproveRequest(requestId, observacoes)
            if (result.success) {
                setSuccessType('authorization')
                setShowSuccess(true)
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh()
                }, 3000)
            } else {
                setError(result.message || 'Erro ao pré-aprovar solicitação')
                setLoading(false)
            }
            return
        }

        const result = await approveRequest(requestId, {
            ajudaCustoExtraordinaria: parseValue(ajudaCusto),
            descontoOutrosAuxilios: parseValue(desconto),
            valorAPagar: parseValue(valorAPagar),
            observacoes,
            reducaoDiarias50
        })
        if (result.success) {
            setSuccessType('authorization')
            setShowSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 3000)
        } else {
            setError(result.message || 'Erro ao aprovar solicitação')
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!motivoRecusa.trim()) {
            setError('Por favor, informe o motivo da recusa')
            return
        }
        setLoading(true)
        setError('')
        const result = await rejectRequest(requestId, motivoRecusa)
        if (result.success) {
            router.push('/dashboard')
            router.refresh()
        } else {
            setError(result.message || 'Erro ao rejeitar solicitação')
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!motivoCancelamento.trim()) {
            setError('Por favor, informe o motivo do cancelamento')
            return
        }
        setLoading(true)
        setError('')
        const result = await cancelRequest(requestId, motivoCancelamento)
        if (result.success) {
            router.push('/dashboard')
            router.refresh()
        } else {
            setError(result.message || 'Erro ao cancelar solicitação')
            setLoading(false)
        }
    }

    const handleSaveFinancialValues = async () => {
        setLoading(true)
        setError('')
        setSaveFeedback('saving')

        const result = await updateRequestFinancialValues(
            requestId,
            {
                ajudaCustoExtraordinaria: parseValue(ajudaCusto),
                descontoOutrosAuxilios: parseValue(desconto),
                valorAPagar: parseValue(valorAPagar),
                reducaoDiarias50: reducaoDiarias50,
                observacoes: observacoes,
            }
        )

        if (result.success) {
            setSaveFeedback('saved')
            setTimeout(() => setSaveFeedback('idle'), 2000)
        } else {
            setError(result.message || 'Erro ao salvar alterações')
            setSaveFeedback('idle')
        }
        setLoading(false)
    }

    const handlePayment = async () => {
        setLoading(true)
        setError('')
        const result = await registerPayment(requestId, dataPagamento, parseValue(valorPagoConfirmado))
        if (result.success) {
            setShowPaymentForm(false)
            setSuccessType('payment')
            setShowSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 3000)
        } else {
            setError(result.message || 'Erro ao registrar pagamento')
            setLoading(false)
        }
    }

    if (showSuccess) {
        const isAuthorization = successType === 'authorization'
        return (
            <Card className="w-full max-w-3xl mx-auto mt-8 animate-in fade-in zoom-in duration-300">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        {isAuthorization ? (
                            <ThumbsUp className="w-8 h-8 text-green-600" />
                        ) : (
                            <Check className="w-8 h-8 text-green-600" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isRedeMode ? 'Solicitação Pré-Aprovada!' : isAuthorization ? 'Solicitação Autorizada!' : 'Pagamento Registrado!'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {isRedeMode
                            ? 'A solicitação foi pré-aprovada. Os autorizadores financeiros serão notificados para a autorização final.'
                            : isAuthorization
                                ? 'A solicitação foi autorizada com sucesso. O solicitante será notificado por e-mail.'
                                : 'O pagamento foi registrado com sucesso. A solicitação agora aguarda a prestação de contas do solicitante.'
                        }
                    </p>
                    <p className="text-sm text-gray-500">Redirecionando para o painel...</p>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="mt-6 bg-green-600 hover:bg-green-700 text-white"
                    >
                        Voltar para o Painel
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <>
            <Card className="mb-8 bg-blue-50">
                <div className="card-header">
                    <h3 className="card-title">3. Valores Calculados</h3>
                </div>
                <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Quantidade de Diárias</label>
                        <p className="text-xl font-bold text-gray-900">
                            {calculatedValues.quantidadeDiarias === 0.5 ? '0,5' : calculatedValues.quantidadeDiarias}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Valor das Diárias</label>
                        <p className="text-xl font-bold text-gray-900">
                            R$ {formatCurrency(calculatedValues.valorDiarias)}
                        </p>
                        <p className="text-xs text-gray-500">{categoria}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Valor de Deslocamento</label>
                        <p className="text-xl font-bold text-gray-900">
                            R$ {formatCurrency(calculatedValues.valorDeslocamento)}
                        </p>
                    </div>
                </div>

                {!isRedeMode && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={reducaoDiarias50}
                            onChange={(e) => handleReducaoDiariasChange(e.target.checked)}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-900">
                            Aplicar redução de 50% no valor das diárias (conforme resolução)
                        </span>
                    </label>
                    {reducaoDiarias50 && (
                        <div className="mt-2 ml-8 p-2 bg-amber-100 border border-amber-300 rounded text-sm">
                            <span className="font-medium text-amber-800">
                                Valor das diárias com redução: R$ {formatCurrency(calculatedValues.valorDiarias * 0.5)}
                            </span>
                            <span className="text-amber-600 ml-2">
                                (desconto de R$ {formatCurrency(calculatedValues.valorDiarias * 0.5)})
                            </span>
                        </div>
                    )}
                </div>
                )}
                </div>
            </Card>

            {auxiliosTerceiros && auxiliosTerceiros.length > 0 && (
                <Card className="mb-8 bg-amber-50">
                    <div className="card-header">
                        <h3 className="card-title">4. Auxílios de Terceiros</h3>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-2">
                            {auxiliosTerceiros.map((aux, index) => (
                                <li key={index} className="flex justify-between items-center p-3 bg-white rounded-md border">
                                    <span className="text-gray-700">{aux.tipo}</span>
                                    <span className="font-semibold">{aux.quantidade}x</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            )}

            {canShowFinancialFields && (
                <Card className="mb-8 bg-purple-50">
                    <div className="card-header">
                        <h3 className="card-title">{auxiliosTerceiros && auxiliosTerceiros.length > 0 ? '5' : '4'}. Ajustes</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-500">Ajuste os valores conforme necessário antes de aprovar.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Ajuda de Custo Extraordinária (R$)</label>
                                <input
                                    type="text"
                                    value={ajudaCusto}
                                    onChange={(e) => handleAjudaCustoChange(e.target.value)}
                                    onBlur={handleAjudaCustoBlur}
                                    className="input bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Desconto Outros Auxílios (R$)</label>
                                <input
                                    type="text"
                                    value={desconto}
                                    onChange={(e) => handleDescontoChange(e.target.value)}
                                    onBlur={handleDescontoBlur}
                                    className="input bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Valor a Pagar (R$)</label>
                                <input
                                    type="text"
                                    value={valorAPagar}
                                    onChange={(e) => handleValorAPagarChange(e.target.value)}
                                    onBlur={handleValorAPagarBlur}
                                    className="input bg-white font-bold text-lg"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {openAccountabilities.length > 0 && (
                <Card className="mb-8 bg-amber-50 border-2 border-amber-300">
                    <div className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 mb-2">
                                    Prestações de Contas em Aberto
                                </h3>
                                <p className="text-sm text-amber-800 mb-3">
                                    Este solicitante possui {openAccountabilities.length} prestação(ões) de contas pendente(s):
                                </p>
                                <ul className="space-y-2">
                                    {openAccountabilities.map((acc) => (
                                        <li key={acc.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded border border-amber-200">
                                            <span className="font-mono text-xs font-medium text-gray-600">{acc.protocolo}</span>
                                            <span className="flex-1 text-gray-800">{acc.evento}</span>
                                            <StatusBadge status={acc.status} />
                                            <span className="text-xs text-gray-500">
                                                {acc.data_envio ? formatDateTime(acc.data_envio) : '-'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="mb-8 bg-white">
                <div className="card-header">
                    <h3 className="card-title">{canShowFinancialFields
                        ? (auxiliosTerceiros && auxiliosTerceiros.length > 0 ? '6' : '5')
                        : (auxiliosTerceiros && auxiliosTerceiros.length > 0 ? '5' : '4')
                    }. Decisão</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Observações do Autorizador</label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="input bg-white resize-none"
                            rows={3}
                            placeholder="Observações sobre a análise (opcional)..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {!isLocked && (
                            <>
                                <Button
                                    variant="success"
                                    onClick={handleApprove}
                                    disabled={loading}
                                    className="flex-1 shadow-sm"
                                >
                                    {loading ? (
                                        'Processando...'
                                    ) : isRedeMode ? (
                                        <><ThumbsUp className="w-4 h-4 mr-2" /> Pré-Aprovar</>
                                    ) : (
                                        <><ThumbsUp className="w-4 h-4 mr-2" /> Aprovar</>
                                    )}
                                </Button>
                                {!showRejectionForm ? (
                                    <Button
                                        variant="danger"
                                        onClick={() => setShowRejectionForm(true)}
                                        disabled={loading}
                                        className="flex-1 shadow-sm"
                                    >
                                        <ThumbsDown className="w-4 h-4 mr-2" />
                                        Rejeitar
                                    </Button>
                                ) : (
                                    <div className="flex-1 space-y-2 p-3 bg-red-50 rounded-md border border-red-200">
                                        <label className="text-sm font-medium text-red-800">Motivo da Recusa</label>
                                        <textarea
                                            value={motivoRecusa}
                                            onChange={(e) => setMotivoRecusa(e.target.value)}
                                            className="input bg-white resize-none"
                                            rows={2}
                                            placeholder="Informe o motivo..."
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="danger"
                                                onClick={handleReject}
                                                disabled={loading || !motivoRecusa.trim()}
                                                className="flex-1 text-sm"
                                            >
                                                {loading ? 'Rejeitando...' : 'Confirmar Recusa'}
                                            </Button>
                                            <Button
                                                onClick={() => { setShowRejectionForm(false); setMotivoRecusa('') }}
                                                variant="outline"
                                                className="text-sm"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {isAuthorized && !showPaymentForm && !isLocked && (
                            <Button
                                variant="primary"
                                onClick={() => setShowPaymentForm(true)}
                                className="shadow-sm"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Registrar Pagamento
                            </Button>
                        )}

                        {isAuthorized && isLocked && !showCancelForm && saveFeedback !== 'saved' && (
                            <Button
                                variant="primary"
                                onClick={handleSaveFinancialValues}
                                disabled={loading}
                                className="px-4 py-1.5 text-sm shadow-sm"
                            >
                                {saveFeedback === 'saving' ? (
                                    'Salvando...'
                                ) : (
                                    <><Check className="w-4 h-4 mr-2" /> Salvar</>
                                )}
                            </Button>
                        )}

                        {saveFeedback === 'saved' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm font-medium">
                                <Check className="w-4 h-4" />
                                Valores salvos
                            </div>
                        )}

                        {currentStatus && ['pendente', 'retificada', 'pre_aprovada', 'autorizada'].includes(currentStatus) && !showCancelForm && (
                            <Button
                                variant="warning"
                                onClick={() => { setShowCancelForm(true); setError('') }}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm shadow-sm"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar Solicitação
                            </Button>
                        )}
                    </div>

                    {currentStatus && ['pendente', 'retificada', 'pre_aprovada', 'autorizada'].includes(currentStatus) && showCancelForm && (
                        <div className="mt-3 space-y-3 p-4 bg-red-50 rounded-md border border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-900 text-sm">Confirmar Cancelamento</p>
                                    <p className="text-sm text-red-700 mt-1">
                                        Esta ação não pode ser desfeita. O solicitante será notificado por e-mail.
                                    </p>
                                </div>
                            </div>
                            <textarea
                                value={motivoCancelamento}
                                onChange={(e) => setMotivoCancelamento(e.target.value)}
                                className="input bg-white resize-none w-full"
                                rows={2}
                                placeholder="Informe o motivo do cancelamento..."
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => { setShowCancelForm(false); setMotivoCancelamento('') }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    variant="warning"
                                    onClick={handleCancel}
                                    disabled={loading || !motivoCancelamento.trim()}
                                    className="flex-1"
                                >
                                    {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {showPaymentForm && (
                <Card ref={paymentRef} className="mb-8 bg-green-50 animate-in fade-in slide-in-from-top-4 border-2 border-green-200 shadow-md">
                    <div className="card-header" style={{ borderBottomColor: 'var(--border)' }}>
                        <h3 className="card-title">
                            {canShowFinancialFields
                                ? (auxiliosTerceiros && auxiliosTerceiros.length > 0 ? '7' : '6')
                                : (auxiliosTerceiros && auxiliosTerceiros.length > 0 ? '6' : '5')
                            }. Pagamento
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">
                            Confirme os dados do pagamento realizado. Esta ação atualizará o status da solicitação para &quot;Paga&quot;. O solicitante ainda precisará realizar a prestação de contas separadamente.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Data do Pagamento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={dataPagamento}
                                        onChange={(e) => setDataPagamento(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 input bg-white text-lg font-medium h-12 opacity-100"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">Valor Pago (R$)</label>
                                <input
                                    type="text"
                                    value={valorPagoConfirmado}
                                    onChange={(e) => setValorPagoConfirmado(formatValue(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold text-lg input bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-green-200">
                            <Button
                                variant="outline"
                                onClick={() => setShowPaymentForm(false)}
                                className="flex-1 bg-white hover:bg-gray-50 text-gray-700"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handlePayment}
                                disabled={loading}
                                className="flex-1 text-white shadow-sm"
                                style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#166534'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                            >
                                {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {showAccountabilityWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-orange-50 rounded-lg shadow-xl w-full max-w-md overflow-hidden border-2 border-orange-300">
                        <div className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-orange-900">Prestações em Aberto</h3>
                                    <p className="text-sm text-orange-700 mt-1">
                                        Este solicitante possui <strong>{openAccountabilities.length} prestação(ões) de contas</strong> ainda não finalizada(s). Deseja prosseguir com a autorização mesmo assim?
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-orange-200">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAccountabilityWarning(false)}
                                    className="flex-1 bg-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowAccountabilityWarning(false)
                                        handleApprove()
                                    }}
                                    className="flex-1 text-white"
                                    style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                                >
                                    Prosseguir
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
