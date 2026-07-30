import { z } from 'zod'

export const updateAccountabilityStatusSchema = z.object({
  accountabilityId: z.string().uuid('ID da prestação inválido'),
  requestId: z.string().uuid('ID da solicitação inválido'),
  status: z.string().min(1, 'Status é obrigatório'),
})
export type UpdateAccountabilityStatusInput = z.infer<typeof updateAccountabilityStatusSchema>

export const saveAccountabilityDraftSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  accountabilityId: z.string().uuid('ID da prestação inválido').nullable(),
  objective: z.string().min(1, 'Objetivo é obrigatório'),
  activities: z.string().min(1, 'Atividades são obrigatórias'),
})
export type SaveAccountabilityDraftInput = z.infer<typeof saveAccountabilityDraftSchema>

export const uploadAccountabilityFilesSchema = z.object({
  accountabilityId: z.string().uuid('ID da prestação inválido'),
  requestId: z.string().uuid('ID da solicitação inválido'),
})
export type UploadAccountabilityFilesInput = z.infer<typeof uploadAccountabilityFilesSchema>
