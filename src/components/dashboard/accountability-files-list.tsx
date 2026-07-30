'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Download, Eye, X } from 'lucide-react'
import { getSignedFileUrl } from '@/lib/storage/signed-urls'
import { parseStorageUrl } from '@/lib/storage/parse-storage-url'
import { PdfViewer } from '@/components/ui/pdf-viewer'

interface AccountabilityFile {
    id: string
    nome_arquivo: string
    tipo_arquivo: string
    arquivo_url: string
    data_upload: string
}

interface AccountabilityFilesListProps {
    files: AccountabilityFile[]
}

export function AccountabilityFilesList({ files }: AccountabilityFilesListProps) {
    const [selectedFile, setSelectedFile] = useState<AccountabilityFile | null>(null)
    const [mounted, setMounted] = useState(false)
    const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        const refreshUrls = async () => {
            const urlMap: Record<string, string> = {}
            for (const file of files) {
                try {
                    const parsed = parseStorageUrl(file.arquivo_url)
                    if (!parsed) {
                        urlMap[file.id] = file.arquivo_url
                        continue
                    }
                    const signed = await getSignedFileUrl(parsed.bucket, decodeURIComponent(parsed.filePath), 3600)
                    urlMap[file.id] = signed || file.arquivo_url
                } catch {
                    urlMap[file.id] = file.arquivo_url
                }
            }
            setFileUrls(urlMap)
        }
        refreshUrls()
    }, [files])

    if (!files || files.length === 0) {
        return <p className="text-gray-500 text-center py-4">Nenhum arquivo anexado</p>
    }

    const isImage = (file: AccountabilityFile) => {
        const ext = file.tipo_arquivo?.toLowerCase() || ''
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.replace('.', ''))
    }

    const isPdf = (file: AccountabilityFile) => {
        const ext = file.tipo_arquivo?.toLowerCase() || ''
        return ext.includes('pdf')
    }

    const modalContent = selectedFile && mounted ? (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            style={{
                zIndex: 999999,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
            onClick={() => setSelectedFile(null)}
        >
            <div
                className="rounded-lg shadow-2xl"
                style={{
                    width: '1024px',
                    height: '768px',
                    maxWidth: '95vw',
                    maxHeight: '95vh',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#FFE4D6'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between p-4 border-b"
                    style={{
                        flexShrink: 0,
                        backgroundColor: '#FFE4D6',
                        borderColor: '#fcd5c0'
                    }}
                >
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                        {selectedFile.nome_arquivo}
                    </h3>
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                        style={{ flexShrink: 0 }}
                        title="Fechar"
                    >
                        <X className="w-6 h-6 text-primary" />
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                    {isImage(selectedFile) ? (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#1f2937'
                        }}>
                            <img
                                src={fileUrls[selectedFile.id] || selectedFile.arquivo_url}
                                alt={selectedFile.nome_arquivo}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    ) : isPdf(selectedFile) ? (
                        <PdfViewer
                            storagePath={(() => {
                                const parsed = parseStorageUrl(selectedFile.arquivo_url)
                                return parsed ? decodeURIComponent(parsed.filePath) : ''
                            })()}
                            fileName={selectedFile.nome_arquivo}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f3f4f6'
                        }}>
                            <div className="text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Pré-visualização não disponível para este tipo de arquivo.</p>
                                <a
                                    href={fileUrls[selectedFile.id] || selectedFile.arquivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Baixar Arquivo
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) : null

    return (
        <>
            <div className="space-y-3">
                {files.map((arquivo) => {
                    // Parse date with try-catch
                    let dateStr = 'Data não disponível'
                    if (arquivo.data_upload) {
                        try {
                            const date = new Date(arquivo.data_upload)
                            if (!isNaN(date.getTime())) {
                                dateStr = date.toLocaleDateString('pt-BR')
                            }
                        } catch (e) {
                            // Keep default message
                        }
                    }

                    return (
                        <div key={arquivo.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => setSelectedFile(arquivo)}
                                    className="btn btn-primary inline-flex items-center gap-2"
                                    style={{ fontSize: '1rem' }}
                                >
                                    <Eye className="w-4 h-4" />
                                    Visualizar
                                </button>
                                <a
                                    href={fileUrls[arquivo.id] || arquivo.arquivo_url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`btn btn-primary inline-flex items-center gap-2 ${!fileUrls[arquivo.id] && !arquivo.arquivo_url ? 'opacity-50 pointer-events-none' : ''}`}
                                    style={{ fontSize: '1rem' }}
                                    onClick={(e) => !fileUrls[arquivo.id] && !arquivo.arquivo_url && e.preventDefault()}
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar
                                </a>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{arquivo.nome_arquivo || 'Arquivo'}</p>
                                    <p className="text-sm text-gray-500">
                                        {arquivo.tipo_arquivo} • {dateStr}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {mounted && modalContent && createPortal(modalContent, document.body)}
        </>
    )
}
