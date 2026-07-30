'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Save, Type } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSystemSettings, SystemSettings } from '@/app/actions/system-actions'

interface SystemSettingsFormProps {
    initialSettings: SystemSettings | null
}

const FONTS = [
    { name: 'Inter', class: 'font-inter' },
    { name: 'Open Sans', class: 'font-open-sans' },
    { name: 'Roboto', class: 'font-roboto' },
    { name: 'Montserrat', class: 'font-montserrat' },
    { name: 'Lato', class: 'font-lato' },
]

export function SystemSettingsForm({ initialSettings }: SystemSettingsFormProps) {
    const [fontePadrao, setFontePadrao] = useState(initialSettings?.fonte_padrao || 'Inter')
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)

        const result = await updateSystemSettings(fontePadrao)
        setIsSaving(false)

        if (result.success) {
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso! A fonte será aplicada ao recarregar ou navegar.' })
            // Opcional: recarregar a página para aplicar a fonte imediatamente
            // window.location.reload()
        } else {
            setMessage({ type: 'error', text: (result as any).error || (result as any).message || 'Erro ao salvar configurações.' })
        }
    }

    const selectedFontClass = FONTS.find(f => f.name === fontePadrao)?.class || 'font-inter'

    return (
        <div className="max-w-4xl space-y-6">
            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-50 text-green-900 border-green-200' : ''}>
                    {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{message.type === 'success' ? 'Sucesso' : 'Erro'}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Type className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Tipografia</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="font-select">Fonte Padrão do Sistema</Label>
                            <Select value={fontePadrao} onValueChange={setFontePadrao}>
                                <SelectTrigger id="font-select">
                                    <SelectValue placeholder="Selecione uma fonte" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONTS.map((font) => (
                                        <SelectItem key={font.name} value={font.name}>
                                            {font.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Esta fonte será aplicada em todos os elementos do sistema, incluindo botões, inputs e menus.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Visualização (Preview)</Label>
                        <div className={`p-6 border rounded-lg bg-gray-50 ${selectedFontClass}`}>
                            <h3 className="text-lg font-bold mb-2">Título de Exemplo</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Este é um texto de exemplo para visualizar como a fonte "{fontePadrao}" ficará no sistema.
                            </p>
                            <div className="flex gap-2">
                                <Button>Botão Exemplo</Button>
                                <Button variant="outline">Secundário</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Salvar Alterações
                            </div>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
