'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveRequest } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, CheckCircle, Send, Pencil } from 'lucide-react'
import { safeJsonParse, AuxilioTerceiro } from '@/lib/format-utils'

interface Distancia {
    id: number
    distancia: string
    valor: number
}

interface RequestFormData {
    id: string
    tipo_evento: string
    nome_evento: string
    local_evento: string
    instituicao_executora: string
    data_periodo_inicio: string
    data_periodo_fim: string
    distancia_id: number | null
    cidade_origem: string
    cidade_destino: string
    data_partida: string
    data_retorno: string
    tem_aereo: boolean
    voo_ida: string | null
    voo_volta: string | null
    auxilios_terceiros: { tipo: string; quantidade: number }[]
    hospedagem_cosems: boolean
    observacoes: string | null
}

const AUXILIOS_OPTIONS = [
    'Transfer: aeroporto x hotel',
    'Transfer: hotel x local do evento',
    'Adicional de deslocamento',
    'Passagem aérea',
    'Passagem rodoviária',
    'Hospedagem',
    'Diárias',
    'Alimentação: café da manhã',
    'Alimentação: almoço',
    'Alimentação: jantar'
]

const TIPOS_EVENTO = [
    'Capacitação',
    'Seminário',
    'Fórum',
    'Conferência',
    'Congresso',
    'Reunião',
    'Oficina',
    'Encontro',
    'Assembleia',
    'Outros',
]

const INSTITUICOES = [
    'COSEMS',
    'SES',
    'Ministério da Saúde',
    'CONASEMS',
    'Outro',
]

export function RequestForm({ distancias, initialData }: { distancias: Distancia[]; initialData?: RequestFormData }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const viewParam = searchParams.get('view') === 'requester' ? '?view=requester' : ''
    const [state, formAction] = useActionState(saveRequest, null)

    const [temAereo, setTemAereo] = useState(initialData?.tem_aereo || false)

    const fmt = (d: string | undefined | null) => d ? d.slice(0, 10) : ''

    const [dataInicio, setDataInicio] = useState(fmt(initialData?.data_periodo_inicio))
    const [dataFim, setDataFim] = useState(fmt(initialData?.data_periodo_fim))
    const [dataPartida, setDataPartida] = useState(fmt(initialData?.data_partida))
    const [dataRetorno, setDataRetorno] = useState(fmt(initialData?.data_retorno))
    const [dateError, setDateError] = useState('')
    const [eventDateError, setEventDateError] = useState('')
    const [isPending, startTransition] = useTransition()

    const isOutrosEvento = initialData && !TIPOS_EVENTO.includes(initialData.tipo_evento)
    const [tipoEvento, setTipoEvento] = useState(isOutrosEvento ? 'Outros' : (initialData?.tipo_evento || ''))
    const isOutrosInstituicao = initialData && !INSTITUICOES.includes(initialData.instituicao_executora)
    const [instituicao, setInstituicao] = useState(isOutrosInstituicao ? 'Outro' : (initialData?.instituicao_executora || ''))
    const [outrosEvento, setOutrosEvento] = useState(isOutrosEvento ? initialData.tipo_evento : '')
    const [outrosInstituicao, setOutrosInstituicao] = useState(isOutrosInstituicao ? initialData.instituicao_executora : '')

    const parseAuxilios = (): AuxilioTerceiro[] => {
        if (!initialData?.auxilios_terceiros) return []
        return safeJsonParse<AuxilioTerceiro[]>(initialData.auxilios_terceiros, [])
    }

    const [auxilios, setAuxilios] = useState<AuxilioTerceiro[]>(parseAuxilios())
    const [selectedAuxilio, setSelectedAuxilio] = useState('')
    const [quantidadeAuxilio, setQuantidadeAuxilio] = useState(1)

    const addAuxilio = () => {
        if (selectedAuxilio && quantidadeAuxilio > 0) {
            setAuxilios([...auxilios, { tipo: selectedAuxilio, quantidade: quantidadeAuxilio }])
            setSelectedAuxilio('')
            setQuantidadeAuxilio(1)
        }
    }

    const removeAuxilio = (index: number) => {
        setAuxilios(auxilios.filter((_, i) => i !== index))
    }

    const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setDataInicio(value)
        setDataPartida(value)
        validateDates(value, dataRetorno)
        validateEventPeriod(value, dataFim)
    }

    const handleDataFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setDataFim(value)
        setDataRetorno(value)
        validateDates(dataPartida, value)
        validateEventPeriod(dataInicio, value)
    }

    const handleDataPartidaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setDataPartida(value)
        validateDates(value, dataRetorno)
    }

    const handleDataRetornoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setDataRetorno(value)
        validateDates(dataPartida, value)
    }

    const validateDates = (partida: string, retorno: string) => {
        if (!partida || !retorno) { setDateError(''); return }
        if (partida > retorno) {
            setDateError('A data de partida não pode ser posterior à data de retorno')
            return
        }
        const diffDays = Math.ceil(Math.abs(new Date(retorno).getTime() - new Date(partida).getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays > 30) {
            setDateError('O intervalo entre partida e retorno não pode ser superior a 30 dias')
            return
        }
        setDateError('')
    }

    const validateEventPeriod = (inicio: string, fim: string) => {
        if (!inicio || !fim) { setEventDateError(''); return }
        if (inicio > fim) {
            setEventDateError('A data de início do evento não pode ser posterior à data de fim')
            return
        }
        setEventDateError('')
    }

    const [showSuccess, setShowSuccess] = useState(false)

    if (state?.success && !showSuccess) {
        setShowSuccess(true)
        const redirectTo = initialData
            ? `/dashboard/requests/${initialData.id}${viewParam}`
            : `/dashboard${viewParam}`
        setTimeout(() => router.push(redirectTo), 3000)
    }

    const [showErrorModal, setShowErrorModal] = useState(false)
    const [currentError, setCurrentError] = useState<string | null>(null)

    if (state?.error && state.error !== currentError) {
        setCurrentError(state.error)
        setShowErrorModal(true)
    }

    const closeErrorModal = () => setShowErrorModal(false)

    if (showSuccess) {
        const isEdit = !!initialData
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{isEdit ? 'Solicitação Atualizada!' : 'Solicitação Registrada!'}</h2>
                        <p className="text-gray-600">{isEdit ? 'Sua solicitação foi alterada com sucesso.' : 'Sua solicitação de auxílio foi cadastrada com sucesso e será analisada.'}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecionando...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <>
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md mx-4">
                        <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
                            <p className="text-gray-600 mb-6">{state?.error}</p>
                            <button onClick={closeErrorModal} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Fechar</button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <form action={(formData) => startTransition(() => formAction(formData))} className="space-y-4 md:space-y-6 lg:space-y-8">
                {/* Hidden fields for state data */}
                {initialData && <input type="hidden" name="request_id" value={initialData.id} />}
                <input type="hidden" name="data_partida" value={dataPartida} />
                <input type="hidden" name="data_retorno" value={dataRetorno} />
                <input type="hidden" name="data_periodo_inicio" value={dataInicio} />
                <input type="hidden" name="data_periodo_fim" value={dataFim} />
                <input type="hidden" name="auxilios_terceiros" value={JSON.stringify(auxilios)} />

                {dateError && (
                    <div className="p-4 bg-error/10 text-error rounded-md border border-error/30 text-sm font-medium flex items-center gap-2">
                        <span>⚠ {dateError}</span>
                    </div>
                )}
                {eventDateError && (
                    <div className="p-4 bg-error/10 text-error rounded-md border border-error/30 text-sm font-medium flex items-center gap-2">
                        <span>⚠ {eventDateError}</span>
                    </div>
                )}

                {/* CARD 1: DADOS DO EVENTO */}
                <Card>
                    <div className="card-header">
                        <h3 className="card-title">1. Dados do Evento</h3>
                    </div>
                    <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label" htmlFor="tipo_evento">Tipo de Evento</label>
                            {tipoEvento === 'Outros' ? (
                                <input
                                    id="tipo_evento"
                                    name="tipo_evento"
                                    className="input"
                                    placeholder="Especifique o tipo de evento"
                                    value={outrosEvento}
                                    onChange={(e) => setOutrosEvento(e.target.value)}
                                    required
                                />
                            ) : (
                                <select id="tipo_evento" name="tipo_evento" className="input" required
                                    value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Input label="Nome do Evento" name="nome_evento" placeholder="Ex: Congresso Nacional de Saúde" defaultValue={initialData?.nome_evento} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Input label="Local do Evento" name="local_evento" placeholder="Ex: Centro de Convenções" defaultValue={initialData?.local_evento} required />
                        </div>
                        <div className="space-y-2">
                            <label className="label" htmlFor="instituicao_executora">Instituição Executora</label>
                            {instituicao === 'Outro' ? (
                                <input
                                    id="instituicao_executora"
                                    name="instituicao_executora"
                                    className="input"
                                    placeholder="Especifique a instituição"
                                    value={outrosInstituicao}
                                    onChange={(e) => setOutrosInstituicao(e.target.value)}
                                    required
                                />
                            ) : (
                                <select id="instituicao_executora" name="instituicao_executora" className="input" required
                                    value={instituicao} onChange={(e) => setInstituicao(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {INSTITUICOES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Input label="Data Início do Evento" name="data_inicio_display" type="date"
                                value={dataInicio} onChange={handleDataInicioChange} required />
                        </div>
                        <div className="space-y-2">
                            <Input label="Data Fim do Evento" name="data_fim_display" type="date"
                                value={dataFim} onChange={handleDataFimChange} required />
                        </div>
                    </div>
                    </div>
                </Card>

                {/* CARD 2: DESLOCAMENTO TERRESTRE */}
                <Card>
                    <div className="card-header">
                        <h3 className="card-title">2. Deslocamento Terrestre</h3>
                    </div>
                    <div className="p-6 space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label" htmlFor="distancia_id">Distância (km)</label>
                            <select id="distancia_id" name="distancia_id" className="input" defaultValue={initialData?.distancia_id ?? ''}>
                                <option value="">Selecione a distância...</option>
                                {distancias.map(d => (
                                    <option key={d.id} value={d.id}>{d.distancia} — R$ {d.valor.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Input label="Cidade de Origem" name="cidade_origem" placeholder="Ex: João Pessoa" defaultValue={initialData?.cidade_origem} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Input label="Cidade de Destino" name="cidade_destino" placeholder="Ex: Campina Grande" defaultValue={initialData?.cidade_destino} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Input label="Data de Partida" name="data_partida_display" type="date"
                                value={dataPartida} onChange={handleDataPartidaChange} />
                        </div>
                        <div className="space-y-2">
                            <Input label="Data de Retorno" name="data_retorno_display" type="date"
                                value={dataRetorno} onChange={handleDataRetornoChange} />
                        </div>
                    </div>
                    </div>
                </Card>

                {/* DESLOCAMENTO AÉREO */}
                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="tem_aereo" name="tem_aereo"
                            className="w-4 h-4 text-primary border-gray-300 rounded"
                            checked={temAereo} onChange={(e) => setTemAereo(e.target.checked)} />
                        <label htmlFor="tem_aereo" className="text-sm font-medium text-gray-700">Necessito de Deslocamento Aéreo</label>
                    </div>
                    {temAereo && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                            <Input label="Voo de Ida (Nº e Horário)" name="voo_ida" placeholder="Ex: LATAM 1234 - 14:00" defaultValue={initialData?.voo_ida ?? ''} required />
                            <Input label="Voo de Volta (Nº e Horário)" name="voo_volta" placeholder="Ex: LATAM 4321 - 18:00" defaultValue={initialData?.voo_volta ?? ''} required />
                        </div>
                    )}
                </div>

                {/* CARD 3: AUXÍLIOS DE TERCEIROS */}
                <Card className="bg-amber-50">
                    <div className="card-header">
                        <h3 className="card-title">3. Auxílios Recebidos de Terceiros</h3>
                    </div>
                    <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">Informe se você está recebendo auxílios de outra instituição para este evento.</p>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-gray-50 p-4 rounded-md">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-primary">Tipo de Auxílio</label>
                            <select className="input bg-white" value={selectedAuxilio} onChange={(e) => setSelectedAuxilio(e.target.value)}>
                                <option value="">Selecione...</option>
                                {AUXILIOS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-24 space-y-2">
                            <label className="text-sm font-medium text-primary">Qtd.</label>
                            <input type="number" min="1" max="10" className="input w-full" value={quantidadeAuxilio}
                                onChange={(e) => setQuantidadeAuxilio(parseInt(e.target.value))} />
                        </div>
                        <div className="w-full sm:w-32 space-y-2">
                            <label className="text-sm font-medium text-transparent select-none hidden sm:block">&nbsp;</label>
                            <Button type="button" onClick={addAuxilio} disabled={!selectedAuxilio}
                                className="bg-green-600 hover:bg-green-700 text-white w-full h-42px sm:h-50px flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Adicionar
                            </Button>
                        </div>
                    </div>

                    {auxilios.length > 0 && (
                        <div className="space-y-2">
                            {auxilios.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                                    <span className="text-sm text-gray-700">
                                        <span className="font-semibold">{item.quantidade}x</span> {item.tipo}
                                    </span>
                                    <button type="button" onClick={() => removeAuxilio(index)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </Card>

                {/* CARD 4: OUTRAS INFORMAÇÕES */}
                <Card className="bg-purple-50">
                    <div className="card-header">
                        <h3 className="card-title">4. Outras Informações</h3>
                    </div>
                    <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="hospedagem_cosems" name="hospedagem_cosems"
                            className="w-4 h-4 text-primary border-gray-300 rounded" defaultChecked={initialData?.hospedagem_cosems} />
                        <label htmlFor="hospedagem_cosems" className="text-sm font-medium text-gray-700">Hospedagem custeada pelo COSEMS</label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Observações</label>
                        <textarea name="observacoes" rows={4} className="input bg-white resize-none"
                            placeholder="Informações adicionais relevantes..." defaultValue={initialData?.observacoes ?? ''}></textarea>
                    </div>
                    </div>
                </Card>

                <div className="flex justify-start pt-4">
                    <Button type="submit" className="flex items-center gap-2" disabled={!!dateError || !!eventDateError || isPending}>
                        {isPending ? (
                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> {initialData ? 'Atualizando...' : 'Enviando...'}</>
                        ) : initialData ? (
                            <><Pencil className="w-4 h-4" /> Atualizar Solicitação</>
                        ) : (
                            <><Send className="w-4 h-4" /> Enviar Solicitação</>
                        )}
                    </Button>
                </div>
            </form>
        </>
    )
}
