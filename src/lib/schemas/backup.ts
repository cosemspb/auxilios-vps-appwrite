import { z } from 'zod'

export const saveScheduleSchema = z.object({
  horario: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  habilitado: z.boolean(),
})
export type SaveScheduleInput = z.infer<typeof saveScheduleSchema>

export const restorePreviewSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp do backup é obrigatório'),
})
export type RestorePreviewInput = z.infer<typeof restorePreviewSchema>

export const executeRestoreSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp do backup é obrigatório'),
})
export type ExecuteRestoreInput = z.infer<typeof executeRestoreSchema>

export const backupHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})
export type BackupHistoryInput = z.infer<typeof backupHistorySchema>
