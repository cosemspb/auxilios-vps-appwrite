'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { executeBackup, getBackupHistory, getSchedule, saveSchedule } from './actions'
import { Loader2, Database, Cloud, CheckCircle, AlertCircle, Server, History, FileArchive, RefreshCw, Clock } from 'lucide-react'

export default function BackupPage() {
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<{
        success: boolean
        message: string
        details?: { arquivo_backup?: string; tamanho_bytes?: number; r2_file_count?: number; storage?: string }
        error?: string
    } | null>(null)

    const [history, setHistory] = useState<any[]>([])
    const [historyPage, setHistoryPage] = useState(1)
    const [historyTotalPages, setHistoryTotalPages] = useState(1)

    const [scheduleHorario, setScheduleHorario] = useState('03:00')
    const [scheduleEnabled, setScheduleEnabled] = useState(false)
    const [scheduleLastRun, setScheduleLastRun] = useState<string | null>(null)
    const [scheduleSaving, setScheduleSaving] = useState(false)
    const [scheduleResult, setScheduleResult] = useState<{ success: boolean; message: string } | null>(null)

    const fetchHistory = async () => {
        const res = await getBackupHistory(historyPage, 10)
        setHistory(res.data)
        setHistoryTotalPages(res.totalPages)
    }

    useEffect(() => { fetchHistory() }, [historyPage])

    useEffect(() => {
        getSchedule().then(s => {
            const horario = (s.horario as string || '03:00').slice(0, 5)
            setScheduleHorario(horario)
            setScheduleEnabled(s.habilitado)
            setScheduleLastRun(s.ultima_execucao)
        })
    }, [])

    async function handleBackup() {
        setRunning(true)
        setResult(null)
        const res = await executeBackup()
        setResult(res)
        setRunning(false)
        if (res.success) fetchHistory()
    }

    async function handleSaveSchedule() {
        setScheduleSaving(true)
        setScheduleResult(null)
        const res = await saveSchedule(scheduleHorario, scheduleEnabled)
        setScheduleResult(res)
        setScheduleSaving(false)
        if (res.success) {
            const s = await getSchedule()
            setScheduleLastRun(s.ultima_execucao)
        }
    }

    function formatBytes(bytes: number): string {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Backup</h1>
                    <p className="text-gray-500">Backup manual do banco de dados e arquivos de storage</p>
                </div>
                <a href="/dashboard/admin/restore" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    <RefreshCw className="w-4 h-4 mr-2" /> Restaurar Backup
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-50">
                            <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">PostgreSQL</h3>
                             <p className="text-sm text-gray-500">Exportação via REST API</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-purple-50">
                            <FileArchive className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Buckets Storage</h3>
                            <p className="text-sm text-gray-500">comprovantes + avatares</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-orange-50">
                            <Cloud className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Cloudflare R2</h3>
                            <p className="text-sm text-gray-500">Backup completo (DB + arquivos)</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-8 text-center">
                <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Executar Backup Completo</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    O backup exporta tabelas (REST API) + arquivos dos buckets (streaming com hash SHA-256) para o Cloudflare R2.
                </p>

                <Button
                    onClick={handleBackup}
                    disabled={running}
                    className="px-8 py-4 text-lg"
                >
                    {running ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Executando Backup...</>
                    ) : (
                        <><Database className="w-5 h-5 mr-2" /> Executar Backup</>
                    )}
                </Button>

                {result && (
                    <div className={`mt-6 text-left ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} rounded-lg p-4 border`}>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {result.success ? 'Backup concluído' : 'Erro no backup'}
                                </p>
                                <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {result.message}
                                </p>
                                {result.details && (
                                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                                        <p>Arquivo: {result.details.arquivo_backup || '-'}</p>
                                        <p>Tamanho: {formatBytes(result.details.tamanho_bytes || 0)}</p>
                                        <p>Arquivos no R2: {result.details.r2_file_count ?? '-'}</p>
                                    </div>
                                )}
                                {result.error && (
                                    <p className="text-sm text-red-600 mt-1 font-mono">{result.error}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Backup Automático</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Agendar backup diário</p>
                            <p className="text-sm text-gray-500">
                                {scheduleEnabled
                                    ? `Executa todos os dias às ${scheduleHorario} (horário de Brasília)`
                                    : 'Ative para executar backup automaticamente todos os dias'}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={scheduleEnabled}
                                onChange={e => setScheduleEnabled(e.target.checked)}
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${scheduleEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${scheduleEnabled ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
                            </div>
                        </label>
                    </div>

                    {scheduleEnabled && (
                        <div className="flex items-end gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horário (Brasília)</label>
                                <input
                                    type="time"
                                    value={scheduleHorario}
                                    onChange={e => setScheduleHorario(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <Button
                                onClick={handleSaveSchedule}
                                disabled={scheduleSaving}
                                className="px-6"
                            >
                                {scheduleSaving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    )}

                    {scheduleLastRun && (
                        <p className="text-xs text-gray-400">
                            Última execução agendada: {new Date(scheduleLastRun).toLocaleString('pt-BR')}
                        </p>
                    )}

                    {scheduleEnabled && !scheduleLastRun && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            Configure um cron job externo (ex: cron-job.org) para chamar <code className="bg-blue-100 px-1 rounded">/api/cron/backup</code> a cada 5-10 minutos com o header <code className="bg-blue-100 px-1 rounded">x-cron-secret</code> (definido na variável de ambiente CRON_SECRET).
                        </div>
                    )}

                    {scheduleResult && (
                        <p className={`text-sm ${scheduleResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {scheduleResult.message}
                        </p>
                    )}
                </div>
            </Card>

            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Histórico de Backups</h3>
                </div>

                {history.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum backup registrado.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Data</th>
                                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Arquivo</th>
                                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Tamanho</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((b: any) => (
                                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-sm text-gray-900">
                                            {new Date(b.data_execucao).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="py-2 px-3">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-600 font-mono">
                                            {b.arquivo_backup || '-'}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-600">
                                            {formatBytes(b.tamanho_bytes)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {historyTotalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            disabled={historyPage <= 1}
                            onClick={() => setHistoryPage(p => p - 1)}
                        >
                            Anterior
                        </Button>
                        <span className="text-sm text-gray-500 py-1">
                            Página {historyPage} de {historyTotalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={historyPage >= historyTotalPages}
                            onClick={() => setHistoryPage(p => p + 1)}
                        >
                            Próxima
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}
