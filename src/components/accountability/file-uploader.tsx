'use client'

import { Upload, FileText, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExistingFile {
    id: string
    nome_arquivo: string
    arquivo_url: string
}

interface FileUploaderProps {
    files: File[]
    isDragging: boolean
    readOnly?: boolean
    existingFiles?: ExistingFile[]
    onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove: (index: number) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
}

export function FileUploader({
    files,
    isDragging,
    readOnly,
    existingFiles,
    onAdd,
    onRemove,
    onDrop,
    onDragEnter,
    onDragLeave
}: FileUploaderProps) {
    return (
        <>
            {existingFiles && existingFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium" style={{ color: '#1f2937' }}>
                        Arquivos Enviados Anteriormente:
                    </h4>
                    {existingFiles.map((ef) => (
                        <div key={ef.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-3" style={{ color: '#16a34a' }} />
                                <span className="text-sm" style={{ color: '#166534' }}>{ef.nome_arquivo}</span>
                            </div>
                            <a
                                href={ef.arquivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                style={{ background: 'transparent', color: '#16a34a' }}
                                title="Visualizar arquivo"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                        Estes arquivos serão mantidos. Adicione novos arquivos abaixo se necessário.
                    </p>
                </div>
            )}

            <div
                className="rounded-lg p-8 text-center transition-all cursor-pointer relative"
                style={{
                    border: isDragging ? '2px dashed #3b82f6' : '2px dashed #bfdbfe',
                    backgroundColor: isDragging ? '#eff6ff' : '#f0f9ff',
                }}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.borderColor = '#60a5fa'
                        e.currentTarget.style.backgroundColor = '#dbeafe'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.borderColor = '#bfdbfe'
                        e.currentTarget.style.backgroundColor = '#f0f9ff'
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                title="Arraste e solte os arquivos ou clique para selecionar"
            >
                <input
                    type="file"
                    multiple
                    onChange={onAdd}
                    disabled={readOnly}
                    className="absolute inset-0 w-full h-full cursor-pointer z-50"
                    style={{ opacity: 0 }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    title={readOnly ? "Não é possível adicionar arquivos - prestação já enviada" : "Arraste e solte os arquivos ou clique para selecionar"}
                />
                <div className="pointer-events-none">
                    <Upload
                        className="w-10 h-10 mx-auto mb-4"
                        style={{ color: isDragging ? '#2563eb' : '#3b82f6' }}
                    />
                    <p className="text-sm font-medium" style={{ color: '#1d4ed8' }}>
                        {readOnly ? 'Visualização apenas - Prestação já enviada' : 'Clique ou arraste arquivos aqui'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#3b82f6' }}>PDF, JPG, PNG</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium" style={{ color: '#374151' }}>Novos Arquivos Selecionados:</h4>
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-md" style={{ background: '#f9fafb' }}>
                            <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-3" style={{ color: '#6b7280' }} />
                                <span className="text-sm" style={{ color: '#374151' }}>{file.name}</span>
                                <span className="text-xs ml-2" style={{ color: '#9ca3af' }}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            {!readOnly && (
                                <Button
                                    variant="ghost"
                                    onClick={() => onRemove(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    Remover
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}
