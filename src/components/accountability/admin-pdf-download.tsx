'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { generateAccountabilityPDF } from '@/lib/pdf/accountability-pdf'

interface AdminPDFDownloadProps {
    accountabilityId: string
    request: {
        id: string
        protocolo?: string
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
        deslocamentos: { cidade_origem: string; cidade_destino: string; modalidade_aereo: boolean }[]
        usuarios?: { nome: string; cpf: string; categoria: { nome_categoria: string } }
        usuario?: { nome: string; cpf: string; categoria: { nome_categoria: string } }
    }
    accountability: {
        objetivo_participacao?: string
        atividades_realizadas?: string
        data_envio?: string
    }
}

export function AdminPDFDownload({ accountabilityId, request, accountability }: AdminPDFDownloadProps) {
    const [loading, setLoading] = useState(false)

    const userData = (request.usuario || request.usuarios) ?? null

    const handleDownload = async () => {
        setLoading(true)
        try {
            const { getAccountabilityImages } = await import('@/app/actions/accountability-actions')
            const pdfImages = await getAccountabilityImages(accountabilityId)

            const saveDraft = async () => ({ data: { id: accountabilityId } })

            const { error } = await generateAccountabilityPDF(
                'download', request as any, userData as any, accountabilityId,
                accountability.objetivo_participacao || '',
                accountability.atividades_realizadas || '',
                pdfImages, saveDraft,
                accountability.data_envio || null,
                request.data_autorizacao || null
            )
            if (error) throw new Error(error)
        } catch (err: any) {
            console.error('Erro ao gerar PDF:', err)
            alert('Erro ao gerar o relatório.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2"
        >
            {loading ? 'Gerando...' : <><Download className="w-4 h-4" /> Baixar Relatório PDF</>}
        </Button>
    )
}
