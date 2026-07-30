'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Download } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { uploadAccountabilityFiles, updateAccountabilityStatus, saveAccountabilityDraft } from '@/app/actions/accountability-actions'
import { validateFile } from '@/lib/storage/validate-file'
import { generateAccountabilityPDF, type UserData } from '@/lib/pdf/accountability-pdf'
import { FileUploader } from './file-uploader'
import { formatDate } from '@/lib/format-utils'

export interface RequestData {
    id: string
    protocolo?: string
    usuario?: {
        nome: string
        cpf: string
        categoria: {
            nome_categoria: string
        }
    }
    usuarios?: {
        nome: string
        cpf: string
        categoria: {
            nome_categoria: string
        }
    }
    nome_evento: string
    tipo_evento?: string
    local_evento?: string
    data_periodo_inicio: string
    data_periodo_fim: string
    data_partida?: string
    data_retorno?: string
    cidade_origem?: string
    cidade_destino?: string
    instituicao_executora: string
    distancias?: { valor: number; distancia?: string }
    reducao_diarias_50?: boolean
    ajuda_custo_extraordinaria?: number
    desconto_outros_auxilios?: number
    valor_a_pagar?: number
    valor_pago?: number
    data_pagamento?: string
    data_autorizacao?: string
    observacoes?: string
    situacao?: string
    usuario_cpf?: string
    deslocamentos: {
        cidade_origem: string
        cidade_destino: string
        modalidade_aereo: boolean
    }[]
}

interface AccountabilityFormProps {
    request: RequestData
    existingAccountability?: {
        id: string
        objetivo_participacao: string
        atividades_realizadas: string
        status: string
        motivo_recusa?: string
        data_envio?: string
    }
}

export function AccountabilityForm({ request, existingAccountability }: AccountabilityFormProps) {
    const router = useRouter()

    const userData: UserData | null = (request.usuario || request.usuarios) ?? null

    const canEdit = !existingAccountability ||
        existingAccountability.status === 'rascunho' ||
        existingAccountability.status === 'em_retificacao'

    const isReadOnly = !canEdit

    const [objective, setObjective] = useState(existingAccountability?.objetivo_participacao || '')
    const [activities, setActivities] = useState(existingAccountability?.atividades_realizadas || '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [accountabilityId, setAccountabilityId] = useState<string | null>(
        existingAccountability?.id || null
    )

    const saveDraft = async (): Promise<{ data?: { id: string }; error?: string }> => {
        const result = await saveAccountabilityDraft({
            requestId: request.id,
            accountabilityId,
            objective,
            activities,
        })
        if (result.error) return { error: result.error }
        return { data: { id: result.id! } }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            for (const file of newFiles) {
                const validation = validateFile(file, 'comprovante')
                if (validation) { setError(validation.message); return }
            }
            setError(null)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files)
            for (const file of newFiles) {
                const validation = validateFile(file, 'comprovante')
                if (validation) { setError(validation.message); return }
            }
            setError(null)
            setFiles(prev => [...prev, ...newFiles])
            e.dataTransfer.clearData()
        }
    }

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }

    const submitAccountability = async () => {
        setIsSubmitting(true); setError(null)

        try {
            let localId = accountabilityId
            if (!localId) {
                const { data, error } = await saveDraft()
                if (error || !data) throw error
                localId = data.id
                setAccountabilityId(data.id)
            }

            const uploadFormData = new FormData()
            files.forEach((file, index) => {
                uploadFormData.append(`file_${index}`, file)
            })

            if (files.length > 0) {
                const uploadResult = await uploadAccountabilityFiles(localId, request.id, uploadFormData)
                if (uploadResult.error) throw new Error(uploadResult.error)
            }

            const statusResult = await updateAccountabilityStatus(localId, request.id, 'em_avaliacao')
            if (statusResult.error) throw new Error(statusResult.error)

            setSuccess(true)
            setTimeout(() => router.push('/dashboard'), 3000)
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar a prestação de contas.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const isImageFile = (f: File) => f.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)

    const loadImagesFromStorage = async (): Promise<{ base64: string }[]> => {
        if (!existingAccountability?.id) return []
        const { getAccountabilityImages } = await import('@/app/actions/accountability-actions')
        return getAccountabilityImages(existingAccountability.id)
    }

    const downloadPDF = async () => {
        setIsDownloading(true); setError(null)
        try {
            const [currentImages, storageImages] = await Promise.all([
                Promise.all(
                    files.filter(isImageFile).map(f => new Promise<{ base64: string }>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve({ base64: reader.result as string })
                        reader.onerror = reject
                        reader.readAsDataURL(f)
                    }))
                ),
                loadImagesFromStorage()
            ])
            const allImages = [...currentImages, ...storageImages]

            const { error } = await generateAccountabilityPDF(
                'download', request, userData, accountabilityId,
                objective, activities, allImages, saveDraft,
                existingAccountability?.data_envio || null,
                request.data_autorizacao || null
            )
            if (error) throw new Error(error)
        } catch (err: any) {
            setError(err?.message || 'Erro ao gerar o relatório.')
        } finally {
            setIsDownloading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-3xl mx-auto mt-8">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Prestação de Contas Enviada!</h2>
                    <p className="text-gray-600">Sua prestação de contas foi enviada com sucesso e será analisada.</p>
                    <p className="text-sm text-gray-500 mt-4">Redirecionando para o dashboard...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="w-full max-w-4xl p-4">
            <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={() => router.back()}>
                ← Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Prestação de Contas</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        <div className="space-y-1">
                            <p>Protocolo: <span className="font-mono font-semibold">{request.protocolo || request.id.slice(0, 8).toUpperCase()}</span></p>
                            <p>Solicitação: {request.nome_evento} ({formatDate(request.data_periodo_inicio)})</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {existingAccountability?.motivo_recusa && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Prestação de Contas Recusada</AlertTitle>
                            <AlertDescription>{existingAccountability.motivo_recusa}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="objective">Objetivo da Participação</Label>
                        <Textarea
                            id="objective"
                            placeholder="Descreva o objetivo da sua participação no evento..."
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            disabled={isReadOnly}
                            className="min-h-120px text-base p-4 leading-relaxed font-sans"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="activities">Descrição das Atividades</Label>
                        <Textarea
                            id="activities"
                            placeholder="Descreva as atividades realizadas..."
                            value={activities}
                            onChange={(e) => setActivities(e.target.value)}
                            disabled={isReadOnly}
                            className="min-h-180px text-base p-4 leading-relaxed font-sans"
                        />
                    </div>

                    <FileUploader
                        files={files}
                        isDragging={isDragging}
                        readOnly={isReadOnly}
                        existingFiles={[]}
                        onAdd={handleFileChange}
                        onRemove={removeFile}
                        onDrop={handleDrop}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                    />

                    <div className="flex flex-wrap justify-between gap-3 pt-4">
                        {isReadOnly ? (
                            <Button
                                type="button"
                                onClick={downloadPDF}
                                disabled={isDownloading}
                                className="flex items-center gap-2"
                            >
                                {isDownloading ? 'Gerando...' : <><Download className="w-4 h-4" /> Baixar Relatório PDF</>}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    onClick={downloadPDF}
                                    disabled={isDownloading}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    {isDownloading ? 'Gerando...' : <><Download className="w-4 h-4" /> Baixar Relatório PDF</>}
                                </Button>
                                <Button
                                    onClick={submitAccountability}
                                    disabled={files.length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Prestação de Contas'}
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
