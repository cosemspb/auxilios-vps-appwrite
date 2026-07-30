'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { getBackups, getPreview, executeRestore } from './actions'
import { Loader2, Database, Cloud, CheckCircle, AlertCircle, History, FileArchive, ArrowLeft, RotateCcw, ShieldAlert } from 'lucide-react'

export default function RestorePage() {
    const [step, setStep] = useState<'list' | 'preview' | 'loading' | 'confirm' | 'running' | 'done'>('list')
    const [backups, setBackups] = useState<any[]>([])
    const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null)
    const [preview, setPreview] = useState<any>(null)
    const [confirmText, setConfirmText] = useState('')
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        getBackups().then(setBackups)
    }, [])

    async function handleSelect(timestamp: string) {
        setSelectedTimestamp(timestamp)
        setStep('loading')
        try {
            const p = await getPreview(timestamp)
            if (!p || !p.backup) {
                setPreview({ backup: { timestamp, date: '', sqlFile: null, sqlSize: 0, storageBuckets: [] }, tables: [], dbWarning: 'Erro: preview retornou vazio.' })
            } else {
                setPreview(p)
            }
        } catch (e: any) {
            setPreview({ backup: { timestamp, date: '', sqlFile: null, sqlSize: 0, storageBuckets: [] }, tables: [], dbWarning: 'Erro ao carregar preview: ' + (e.message || String(e)) })
        }
        setStep('preview')
    }

    async function handleRestore() {
        setStep('running')
        setResult(null)
        const res = await executeRestore(selectedTimestamp!)
        setResult(res)
        setStep('done')
    }

    function formatBytes(bytes: number): string {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    function isCompleteBackup(b: any): boolean {
        return b.storageBuckets?.length > 0 && b.storageBuckets.some((s: any) => s.fileCount > 0)
    }

    if (backups.length === 0 && step === 'list') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Restaurar Backup</h1>
                    <p className="text-gray-500">Recuperação de desastres a partir do R2</p>
                </div>
                <Card className="p-8 text-center">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum backup encontrado</h2>
                    <p className="text-gray-500">Execute um backup primeiro na página de Backup.</p>
                </Card>
            </div>
        )
    }

    if (step === 'list') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Restaurar Backup</h1>
                    <p className="text-gray-500">Selecione um backup para restaurar</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {backups.map((b: any) => (
                        <Card key={b.timestamp} className="p-5 hover:border-blue-400 cursor-pointer transition-colors" onClick={() => handleSelect(b.timestamp)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="p-3 rounded-lg bg-blue-50 shrink-0">
                                        <Database className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900">{b.date}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm text-gray-500">
                                                SQL: {formatBytes(b.sqlSize)}
                                                {b.storageBuckets.map((s: any) => ` · ${s.bucket}: ${s.fileCount} arquivos (${formatBytes(s.totalBytes)})`)}
                                            </span>
                                            {!isCompleteBackup(b) && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 shrink-0">
                                                    Apenas DB
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" className="shrink-0 mr-2">Selecionar</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (step === 'loading' || (step === 'preview' && !preview)) {
        return (
            <div className="space-y-6 max-w-lg mx-auto text-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Restaurar Backup</h1>
                    <p className="text-gray-500">Carregando informações do backup...</p>
                </div>
                <Card className="p-12">
                    <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Buscando dados do R2...</p>
                </Card>
            </div>
        )
    }

    if (step === 'preview' && preview) {
        const totalRows = preview.tables?.reduce((s: number, t: any) => s + t.rows, 0) || 0
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setStep('list'); setPreview(null) }} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Restaurar Backup</h1>
                        <p className="text-gray-500">{preview.backup.date}</p>
                    </div>
                </div>

                {preview.dbWarning && (
                    <Card className="p-4 bg-yellow-50 border-yellow-200 border rounded-lg">
                        <p className="text-sm text-yellow-800">{preview.dbWarning}</p>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Banco de Dados</p>
                                <p className="text-sm text-gray-500">{totalRows} registros em {preview.tables?.length || 0} tabelas</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <FileArchive className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Arquivos Storage</p>
                                <p className="text-sm text-gray-500">
                                    {preview.backup.storageBuckets?.map((s: any) => `${s.bucket}: ${s.fileCount} arquivos`).join(', ') || 'Nenhum'}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <Cloud className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Hash SHA-256</p>
                                <p className="text-sm text-gray-500">Verificação durante restore</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {preview.tables && preview.tables.length > 0 && (
                    <Card className="p-5">
                        <h3 className="font-semibold text-gray-900 mb-3">Tabelas</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Tabela</th>
                                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Registros</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.tables.map((t: any) => (
                                        <tr key={t.name} className="border-b border-gray-100">
                                            <td className="py-2 px-3 text-sm text-gray-900 font-mono">{t.name}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600 text-right">{t.rows}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                <Card className="p-6 border-red-200 bg-red-50">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="w-6 h-6 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Atenção: Isso substituirá todos os dados atuais!</h3>
                            <p className="text-sm text-red-700 mt-1">
                                Um auto-backup do estado atual será feito antes de restaurar.
                                Após a restauração, os dados atuais serão perdidos e substituídos pelos dados do backup selecionado.
                                Recomendado apenas para recuperação de desastres.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-center">
                    <Button
                        className="px-8 py-4 text-lg"
                        onClick={() => setStep('confirm')}
                    >
                        <RotateCcw className="w-5 h-5 mr-2" /> Restaurar este Backup
                    </Button>
                </div>
            </div>
        )
    }

    if (step === 'confirm') {
        return (
            <div className="space-y-6 max-w-lg mx-auto">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setStep('preview') }} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Confirmar Restauração</h1>
                        <p className="text-gray-500">Esta ação não pode ser desfeita</p>
                    </div>
                </div>

                <Card className="p-6 border-red-300 bg-red-50">
                    <p className="text-sm text-red-800 font-medium mb-4">
                        Digite <strong>RESTAURAR</strong> abaixo para confirmar que deseja substituir todos os dados atuais pelos dados do backup.
                    </p>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Digite RESTAURAR"
                        className="w-full px-4 py-3 border border-red-300 rounded-lg text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </Card>

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => { setStep('preview'); setConfirmText('') }}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={confirmText !== 'RESTAURAR'}
                        className="px-8 py-4 text-lg"
                        onClick={handleRestore}
                    >
                        <RotateCcw className="w-5 h-5 mr-2" /> Confirmar Restauração
                    </Button>
                </div>
            </div>
        )
    }

    if (step !== 'running' && step !== 'done') return null

    return (
        <div className="space-y-6 max-w-lg mx-auto text-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {step === 'running' ? 'Restaurando...' : 'Restauração Concluída'}
                </h1>
            </div>

            {step === 'running' && (
                <Card className="p-12">
                    <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Restaurando banco de dados e arquivos...</p>
                    <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns minutos</p>
                </Card>
            )}

            {step === 'done' && result && (
                <Card className="p-8">
                    {result.success ? (
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    ) : (
                        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    )}
                    <h2 className={`text-xl font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.success ? 'Restauração concluída' : 'Erro na restauração'}
                    </h2>
                    <p className="text-gray-600 mb-4">{result.message}</p>

                    {result.details && (
                        <div className="text-left bg-gray-50 rounded-lg p-4 space-y-1 text-sm text-gray-600">
                            {result.details.db_rows_restored !== undefined && (
                                <p>Registros restaurados: {result.details.db_rows_restored}</p>
                            )}
                            {result.details.storage_files_restored !== undefined && (
                                <p>Arquivos restaurados: {result.details.storage_files_restored}</p>
                            )}
                            {result.details.storage_bytes !== undefined && (
                                <p>Bytes em storage: {formatBytes(result.details.storage_bytes)}</p>
                            )}
                            {result.details.storage_verified !== undefined && (
                                <p>Integridade SHA-256: {result.details.storage_verified ? '✅ Verificada' : '❌ Divergente'}</p>
                            )}
                        </div>
                    )}

                    {result.error && (
                        <p className="text-sm text-red-600 mt-2 font-mono">{result.error}</p>
                    )}

                    <div className="flex justify-center gap-4 mt-6">
                        <Button variant="outline" onClick={() => { setStep('list'); setResult(null); setPreview(null); setConfirmText(''); getBackups().then(setBackups) }}>
                            Voltar
                        </Button>
                        {!result.success && selectedTimestamp && (
                            <Button onClick={() => { setStep('confirm'); setResult(null) }}>
                                Tentar Novamente
                            </Button>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}
