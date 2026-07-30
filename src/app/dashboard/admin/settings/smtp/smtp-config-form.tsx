'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Save, Mail } from 'lucide-react'
import { saveSmtpConfig, testSmtpConfigAction, toggleSmtpActive, SmtpConfigInput } from '@/app/actions/smtp-actions'

interface SmtpConfigFormProps {
    initialConfig: any
}

export function SmtpConfigForm({ initialConfig }: SmtpConfigFormProps) {
    const [config, setConfig] = useState<SmtpConfigInput>({
        smtp_host: initialConfig?.smtp_host || 'smtp.gmail.com',
        smtp_port: initialConfig?.smtp_port || 465,
        smtp_user: initialConfig?.smtp_user || '',
        // Não inicializar com a senha mascarada - deixar vazio para não sobrescrever
        smtp_password: '',
        smtp_from_email: initialConfig?.smtp_from_email || '',
        smtp_from_name: initialConfig?.smtp_from_name || 'COSEMS PB',
        smtp_secure: initialConfig?.smtp_secure ?? true,
        emails_notificacao_novos_pedidos: initialConfig?.emails_notificacao_novos_pedidos || 'financeiro@cosemspb.org'
    })

    const [isActive, setIsActive] = useState(initialConfig?.ativo ?? true)
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const parsedTestConfig = useMemo(() => {
        if (!initialConfig?.test_email_config) return { destino: 'sylvio.soares@gmail.com', origens: ['autorizador@auxilios.test', 'autorizador.rede@auxilios.test'] }
        try {
            const parsed = JSON.parse(initialConfig.test_email_config)
            return { destino: parsed.destino || '', origens: Array.isArray(parsed.origens) ? parsed.origens : [] }
        } catch (e) { return { destino: '', origens: [] as string[] } }
    }, [initialConfig?.test_email_config])

    const [testDestino, setTestDestino] = useState(parsedTestConfig.destino)
    const [testOrigens, setTestOrigens] = useState(parsedTestConfig.origens.join('\n'))

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        setConfig(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }))
    }

    const handleSwitchChange = (checked: boolean) => {
        setConfig(prev => ({ ...prev, smtp_secure: checked }))
    }

    const handleActiveChange = async (checked: boolean) => {
        setIsActive(checked)
        const result = await toggleSmtpActive(checked)
        if (result.success) {
            setMessage({ type: 'success', text: `Envio de e-mails ${checked ? 'ativado' : 'desativado'} com sucesso.` })
        } else {
            setIsActive(!checked) // Revert
            setMessage({ type: 'error', text: result.error || 'Erro ao alterar status.' })
        }
    }

    const handleTest = async () => {
        setIsTesting(true)
        setMessage(null)

        // Validar campos obrigatórios
        if (!config.smtp_host || !config.smtp_user) {
            setMessage({ type: 'error', text: 'Host e usuário são obrigatórios para testar a conexão.' })
            setIsTesting(false)
            return
        }

        // Se o campo de senha está vazio, precisamos da senha salva
        if (!config.smtp_password) {
            // Verificar se existe configuração salva
            if (!initialConfig?.smtp_password) {
                setMessage({
                    type: 'error',
                    text: 'Por favor, digite a senha para testar a conexão.'
                })
                setIsTesting(false)
                return
            }

            // Usar configuração salva do banco
            const result = await testSmtpConfigAction()
            setIsTesting(false)

            if (result.success) {
                setMessage({ type: 'success', text: `E-mail de teste enviado com sucesso para "${config.emails_notificacao_novos_pedidos || config.smtp_user}"! Verifique a caixa de entrada.` })
            } else {
                setMessage({ type: 'error', text: `Erro no envio do e-mail de teste: ${result.error}` })
            }
            return
        }

        // Testar com os valores do formulário (sem salvar)
        const result = await testSmtpConfigAction({
            smtp_host: config.smtp_host,
            smtp_port: config.smtp_port,
            smtp_user: config.smtp_user,
            smtp_password: config.smtp_password,
            smtp_secure: config.smtp_secure,
        }, config.emails_notificacao_novos_pedidos || config.smtp_user)

        setIsTesting(false)

        if (result.success) {
            setMessage({ type: 'success', text: `E-mail de teste enviado com sucesso para "${config.emails_notificacao_novos_pedidos || config.smtp_user}"! Verifique a caixa de entrada.` })
        } else {
            setMessage({ type: 'error', text: `Erro no envio do e-mail de teste: ${result.error}` })
        }
    }

    useEffect(() => {
        setTestDestino(parsedTestConfig.destino)
        setTestOrigens(parsedTestConfig.origens.join('\n'))
    }, [parsedTestConfig.destino, parsedTestConfig.origens])

    const handleSave = async (showMessage = true) => {
        setIsSaving(true)
        setMessage(null)

        const origensArray = testOrigens
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0)
        config.test_email_config = JSON.stringify({ destino: testDestino, origens: origensArray })

        const result = await saveSmtpConfig(config)
        setIsSaving(false)

        if (showMessage) {
            if (result.success) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' })
            }
        }

        return result
    }

    return (
        <div className="space-y-6">
            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-50 text-green-900 border-green-200' : ''}>
                    {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{message.type === 'success' ? 'Sucesso' : 'Erro'}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Status do Serviço
                    </h2>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="active-mode">{isActive ? 'Ativo' : 'Inativo'}</Label>
                        <Switch
                            id="active-mode"
                            checked={isActive}
                            onCheckedChange={handleActiveChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="smtp_host">Servidor SMTP (Host)</Label>
                        <Input
                            id="smtp_host"
                            name="smtp_host"
                            value={config.smtp_host}
                            onChange={handleChange}
                            placeholder="smtp.gmail.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_port">Porta</Label>
                        <Input
                            id="smtp_port"
                            name="smtp_port"
                            type="number"
                            value={config.smtp_port}
                            onChange={handleChange}
                            placeholder="465"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_user">Usuário (E-mail)</Label>
                        <Input
                            id="smtp_user"
                            name="smtp_user"
                            value={config.smtp_user}
                            onChange={handleChange}
                            placeholder="seu-email@dominio.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_password">Senha (App Password)</Label>
                        <Input
                            id="smtp_password"
                            name="smtp_password"
                            type="password"
                            value={config.smtp_password}
                            onChange={handleChange}
                            placeholder={initialConfig?.smtp_password ? "Senha salva (deixe em branco para manter)" : "Digite a senha"}
                        />
                        <p className="text-xs text-gray-500">
                            {initialConfig?.smtp_password
                                ? "Deixe em branco para manter a senha atual. Para Google Workspace, use uma \"Senha de App\"."
                                : "Para Google Workspace, use uma \"Senha de App\" (App Password)."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_from_name">Nome do Remetente</Label>
                        <Input
                            id="smtp_from_name"
                            name="smtp_from_name"
                            value={config.smtp_from_name}
                            onChange={handleChange}
                            placeholder="COSEMS PB"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_from_email">E-mail do Remetente</Label>
                        <Input
                            id="smtp_from_email"
                            name="smtp_from_email"
                            value={config.smtp_from_email}
                            onChange={handleChange}
                            placeholder="noreply@cosemspb.org"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="emails_notificacao_novos_pedidos">E-mails para Notificação de Novos Pedidos</Label>
                        <Input
                            id="emails_notificacao_novos_pedidos"
                            name="emails_notificacao_novos_pedidos"
                            value={config.emails_notificacao_novos_pedidos || ''}
                            onChange={handleChange}
                            placeholder="financeiro@cosemspb.org; outro@email.com"
                        />
                        <p className="text-xs text-gray-500">
                            Separe múltiplos e-mails com ponto e vírgula (;). Estes e-mails receberão um aviso sempre que uma nova solicitação for criada (demais categorias).
                        </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="emails_notificacao_rede">E-mails para Notificação da Rede Apoiadora</Label>
                        <Input
                            id="emails_notificacao_rede"
                            name="emails_notificacao_rede"
                            value={config.emails_notificacao_rede || ''}
                            onChange={handleChange}
                            placeholder="rede@cosemspb.org; outro@email.com"
                        />
                        <p className="text-xs text-gray-500">
                            Separe múltiplos e-mails com ponto e vírgula (;). Estes e-mails receberão um aviso quando solicitantes da Rede Apoiadora (categoria 11) criarem um novo pedido.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-8">
                        <Switch
                            id="smtp_secure"
                            checked={config.smtp_secure}
                            onCheckedChange={handleSwitchChange}
                        />
                        <Label htmlFor="smtp_secure">Usar conexão segura (SSL/TLS)</Label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <Button
                        variant="outline"
                        onClick={handleTest}
                        className="flex items-center gap-2"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Testando...
                            </>
                        ) : (
                            'Testar Conexão'
                        )}
                    </Button>

                    <Button
                        onClick={() => handleSave(true)}
                        disabled={isSaving || isTesting}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Salvar Configuração
                            </div>
                        )}
                    </Button>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Mail className="w-5 h-5" />
                    Redirecionamento de E-mails de Teste
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    E-mails enviados para os endereços abaixo serão redirecionados automaticamente para o destino configurado.
                    Isso permite testar o fluxo completo com contas de usuário fictícias.
                </p>
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="test_destino">E-mail de Destino</Label>
                        <Input
                            id="test_destino"
                            value={testDestino}
                            onChange={(e) => setTestDestino(e.target.value)}
                            placeholder="sylvio.soares@gmail.com"
                        />
                        <p className="text-xs text-gray-500">
                            Todos os e-mails de teste serão enviados para este endereço.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="test_origens">E-mails de Origem (um por linha)</Label>
                        <textarea
                            id="test_origens"
                            className="input min-h-100px"
                            value={testOrigens}
                            onChange={(e) => setTestOrigens(e.target.value)}
                            placeholder="autorizador@auxilios.test&#10;autorizador.rede@auxilios.test"
                            rows={4}
                        />
                        <p className="text-xs text-gray-500">
                            E-mails que serão interceptados e redirecionados. Coloque um endereço por linha.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
