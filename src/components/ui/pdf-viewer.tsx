'use client'

import { useState, useRef, useEffect } from 'react'
import { ExternalLink, FileText, Loader2 } from 'lucide-react'

interface PdfViewerProps {
  storagePath: string
  fileName: string
}

export function PdfViewer({ storagePath, fileName }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const proxyUrl = `/api/storage/proxy?path=${encodeURIComponent(storagePath)}`

  useEffect(() => {
    setLoading(true)
    setFailed(false)
    timerRef.current = setTimeout(() => {
      setLoading(false)
      setFailed(true)
    }, 8000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [storagePath])

  if (!storagePath) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 p-8">
        <p className="text-sm">Caminho do arquivo inválido.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs truncate">{fileName}</span>
        </div>
        <a
          href={proxyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          Abrir
        </a>
      </div>
      <div className="flex-1 relative bg-gray-900">
        {loading && !failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
        {failed ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <p className="text-sm mb-4">Visualização não disponível neste dispositivo.</p>
            <a
              href={proxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir PDF
            </a>
          </div>
        ) : (
          <iframe
            src={proxyUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => { setLoading(false); if (timerRef.current) clearTimeout(timerRef.current) }}
          />
        )}
      </div>
    </div>
  )
}
