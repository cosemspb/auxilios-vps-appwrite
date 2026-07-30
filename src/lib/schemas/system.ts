import { z } from 'zod'

export const updateSystemSettingsSchema = z.object({
  fontePadrao: z.string().min(1, 'Fonte padrão é obrigatória'),
})
export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>
