'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Eye, X, Loader2, Download, FileText, ExternalLink } from 'lucide-react'
import { generateAccountabilityPDF } from '@/lib/pdf/accountability-pdf'
import { getAccountabilityImages } from '@/app/actions/accountability-actions'

interface AdminPDFViewerProps {
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

export function AdminPDFViewer({ accountabilityId, request, accountability }: AdminPDFViewerProps) {
  const [open, setOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const imagesRef = useRef<{ base64: string }[]>([])

  useEffect(() => { setMounted(true) }, [])

  const userData = (request.usuario || request.usuarios) ?? null

  const generatePdf = async (action: 'email' | 'download'): Promise<string | null> => {
    const saveDraft = async () => ({ data: { id: accountabilityId } })
    const result = await generateAccountabilityPDF(
      action, request as any, userData as any, accountabilityId,
      accountability.objetivo_participacao || '',
      accountability.atividades_realizadas || '',
      imagesRef.current, saveDraft,
      accountability.data_envio || null, request.data_autorizacao || null
    )
    if (result.error) throw new Error(result.error)
    return result.blobUrl || null
  }

  useEffect(() => {
    getAccountabilityImages(accountabilityId).then(imgs => { imagesRef.current = imgs })
  }, [accountabilityId])

  const handleOpen = async () => {
    setGenerating(true)
    setError(null)
    setIframeError(false)
    try {
      const blobUrl = await generatePdf('email')
      if (!blobUrl) throw new Error('Falha ao gerar o PDF.')
      setPdfUrl(blobUrl)
      setOpen(true)
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar o relatório.')
    } finally {
      setGenerating(false)
    }
  }

  const handleClose = () => {
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null) }
    setOpen(false)
    setIframeError(false)
  }

  const handleDownload = async () => {
    await generatePdf('download')
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleOpen}
          disabled={generating}
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {generating ? 'Gerando...' : 'Visualizar Relatório PDF'}
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-md"
        >
          <Download className="w-4 h-4" />
          Baixar
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {open && pdfUrl && mounted && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="rounded-lg shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '1024px', height: '768px', maxWidth: '95vw', maxHeight: '95vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Relatório de Prestação de Contas</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em nova aba
                </a>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100">
              {iframeError ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="mb-4">Visualização inline não disponível neste dispositivo.</p>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir PDF em nova aba
                  </a>
                </div>
              ) : (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Relatório de Prestação de Contas"
                  onError={() => setIframeError(true)}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
