import { getSystemSettings } from '@/app/actions/system-actions'
import { SystemSettingsForm } from '@/app/dashboard/admin/settings/system/system-settings-form'

export default async function SystemSettingsPage() {
    const settings = await getSystemSettings()

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
                <p className="text-gray-500">Personalize a aparência geral do sistema.</p>
            </div>

            <SystemSettingsForm initialSettings={settings} />
        </div>
    )
}
