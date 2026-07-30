'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { TEMPLATES } from '@/lib/email/template-meta'
import { sendTestTemplateEmail } from '@/app/actions/test-email-actions'

export default function EmailTemplatesPage() {
    const [sendingKey, setSendingKey] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ key: string; type: 'success' | 'error'; message: string } | null>(null)

    async function handleSendTest(templateKey: string) {
        setSendingKey(templateKey)
        setFeedback(null)
        try {
            const result = await sendTestTemplateEmail(templateKey)
            setFeedback({
                key: templateKey,
                type: result.success ? 'success' : 'error',
                message: result.success
                    ? 'E-mail de teste enviado! Verifique sua caixa de entrada.'
                    : result.error || 'Erro ao enviar e-mail de teste.'
            })
        } catch {
            setFeedback({ key: templateKey, type: 'error', message: 'Erro ao enviar e-mail de teste.' })
        } finally {
            setSendingKey(null)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Modelos de E-mail</h1>
                <p className="text-gray-600">Os modelos abaixo são usados nas notificações automáticas do sistema.</p>
            </div>

            {feedback && (
                <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {feedback.message}
                    <Button variant="ghost" className="ml-auto p-1 h-auto" onClick={() => setFeedback(null)}>
                        &times;
                    </Button>
                </div>
            )}

            <p className="text-sm text-gray-500">
                Para alterar o conteúdo de qualquer notificação, solicite ao desenvolvedor. As alterações são versionadas no Git e implantadas via deploy.
            </p>

            <div className="grid grid-cols-1 gap-4">
                {TEMPLATES.map((template) => (
                    <Card key={template.key}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base">{template.name}</h3>
                                    <p className="text-sm text-gray-600 mt-0.5">{template.description}</p>

                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                                        <span><strong>Para:</strong> {template.recipient}</span>
                                        <span><strong>Assunto:</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">{template.subject}</code></span>
                                        <span><strong>Função:</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">{template.templateFn}</code></span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {template.availableFields.map((field) => (
                                            <span
                                                key={field.key}
                                                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200"
                                                title={`${field.label}: ${field.example}`}
                                            >
                                                {'{'}{field.key}{'}'}
                                                <span className="text-blue-400">?</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="shrink-0 gap-2"
                                    onClick={() => handleSendTest(template.key)}
                                    disabled={sendingKey === template.key}
                                >
                                    {sendingKey === template.key ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Mail className="w-4 h-4" />
                                    )}
                                    {sendingKey === template.key ? 'Enviando...' : 'Enviar Teste'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
