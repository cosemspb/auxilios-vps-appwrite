'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FileText, X, Loader2, ExternalLink } from 'lucide-react'
import { generateAccountabilityPDF } from '@/lib/pdf/accountability-pdf'
import { getAccountabilityImages } from '@/app/actions/accountability-actions'
import { getAccountabilityDetails } from '@/app/actions/admin-actions'

interface QuickPDFViewerProps {
  accountabilityId: string
}

export function QuickPDFViewer({ accountabilityId }: QuickPDFViewerProps) {
  const [open, setOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [iframeError, setIframeError] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleOpen = async () => {
    setGenerating(true)
    setError(null)
    setIframeError(false)
    try {
      const details = await getAccountabilityDetails(accountabilityId)
      if (!details) throw new Error('Prestação de contas não encontrada.')

      const sol = details.solicitacoes
      const userData = sol?.usuarios ? {
        nome: sol.usuarios.nome || '',
        cpf: (sol.usuarios as any).cpf || '',
        categoria: { nome_categoria: (sol.usuarios as any).categorias?.nome_categoria || '' },
      } : null

      const images = await getAccountabilityImages(accountabilityId)

      const saveDraft = async () => ({ data: { id: accountabilityId } })

      const result = await generateAccountabilityPDF(
        'email',
        sol as any,
        userData as any,
        accountabilityId,
        details.objetivo_participacao || '',
        details.atividades_realizadas || '',
        images,
        saveDraft,
        details.data_envio || null,
        sol?.data_autorizacao || null
      )

      if (result.error) throw new Error(result.error)
      if (!result.blobUrl) throw new Error('Falha ao gerar o PDF.')
      setPdfUrl(result.blobUrl)
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

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={generating}
        className="btn btn-outline btn-icon h-8 w-8 flex items-center justify-center rounded-md"
        title="Visualizar Relatório PDF"
      >
        {generating
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileText className="w-4 h-4" />
        }
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 z-10">
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded shadow-sm whitespace-nowrap">
            {error}
          </p>
        </div>
      )}

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
