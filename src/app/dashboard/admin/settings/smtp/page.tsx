import { SmtpConfigForm } from './smtp-config-form'
import { getSmtpConfigForDisplay } from '@/app/actions/smtp-actions'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Configuração SMTP | Admin',
    description: 'Configuração do servidor de e-mail para notificações',
}

export default async function SmtpSettingsPage() {
    const { data: config } = await getSmtpConfigForDisplay()

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Configuração SMTP</h1>
                <p className="text-gray-600 mt-2">
                    Configure o servidor de e-mail para envio de notificações automáticas do sistema.
                </p>
            </div>

            <SmtpConfigForm initialConfig={config} />
        </div>
    )
}
