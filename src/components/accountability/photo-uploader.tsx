'use client'

import { X, Image as ImageIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface PdfImage {
    id: string
    base64: string
}

interface PhotoUploaderProps {
    pdfImages: PdfImage[]
    isDragging: boolean
    disabled?: boolean
    onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove: (id: string) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
}

export function PhotoUploader({
    pdfImages,
    isDragging,
    disabled,
    onAdd,
    onRemove,
    onDrop,
    onDragEnter,
    onDragLeave
}: PhotoUploaderProps) {
    return (
        <div className="space-y-2">
            <Label>Fotos para o Relatório (Opcional)</Label>
            <div
                className="rounded-lg p-6 text-center transition-all cursor-pointer relative"
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
                title="Arraste e solte as fotos ou clique para selecionar"
            >
                <input
                    type="file"
                    id="pdf-images"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full cursor-pointer z-50"
                    style={{ opacity: 0 }}
                    onChange={onAdd}
                    disabled={disabled}
                />
                <div className="pointer-events-none flex flex-col items-center">
                    <ImageIcon
                        className="w-10 h-10 mb-2"
                        style={{ color: isDragging ? '#2563eb' : '#3b82f6' }}
                    />
                    <span className="text-sm font-medium" style={{ color: '#1d4ed8' }}>
                        Clique para adicionar fotos ao PDF
                    </span>
                    <span className="text-xs mt-1" style={{ color: '#3b82f6' }}>
                        As fotos serão anexadas ao final do documento
                    </span>
                </div>
            </div>
            {pdfImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {pdfImages.map((img) => (
                        <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                            <img src={img.base64} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => onRemove(img.id)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
