import { z } from 'zod'

export const inviteUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  tipo_perfil_id: z.number().int().positive('Perfil é obrigatório'),
  categoria_id: z.number().int().positive().nullable().optional(),
})
export type InviteUserInput = z.infer<typeof inviteUserSchema>

export const updateUserProfileSchema = z.object({
  userCpf: z.string().regex(/^(\d{11}|temp_\w+)$/, 'CPF deve ter 11 dígitos'),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('E-mail inválido').optional(),
  whatsapp: z.string().nullable().optional(),
  necessidades_especiais: z.string().nullable().optional(),
  dados_bancarios: z.record(z.string(), z.string()).nullable().optional(),
  tipo_perfil_id: z.number().int().positive('Perfil é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  categoria_id: z.number().int().positive().nullable().optional(),
})
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

export const resetUserPasswordSchema = z.object({
  userCpf: z.string().regex(/^(\d{11}|temp_\w+)$/, 'CPF deve ter 11 dígitos'),
})
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>

export const preApproveRequestSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  observacoes: z.string().optional(),
})
export type PreApproveRequestInput = z.infer<typeof preApproveRequestSchema>

export const approveRequestValoresSchema = z.object({
  ajudaCustoExtraordinaria: z.number().nonnegative('Valor não pode ser negativo'),
  descontoOutrosAuxilios: z.number().nonnegative('Valor não pode ser negativo'),
  valorAPagar: z.number().nonnegative('Valor não pode ser negativo'),
  observacoes: z.string().optional(),
  reducaoDiarias50: z.boolean().optional(),
})
export type ApproveRequestValoresInput = z.infer<typeof approveRequestValoresSchema>

export const approveRequestSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  valores: approveRequestValoresSchema,
})
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>

export const rejectRequestSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
})
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>

export const approveAccountabilitySchema = z.object({
  accountabilityId: z.string().uuid('ID da prestação inválido'),
})
export type ApproveAccountabilityInput = z.infer<typeof approveAccountabilitySchema>

export const rejectAccountabilitySchema = z.object({
  accountabilityId: z.string().uuid('ID da prestação inválido'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
})
export type RejectAccountabilityInput = z.infer<typeof rejectAccountabilitySchema>

export const registerPaymentSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  dataPagamento: z.string().min(1, 'Data de pagamento é obrigatória'),
  valorPago: z.number().nonnegative('Valor não pode ser negativo'),
})
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>

export const updatePaymentInfoSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  dataPagamento: z.string().min(1, 'Data de pagamento é obrigatória'),
  valorPago: z.number().nonnegative('Valor não pode ser negativo'),
})
export type UpdatePaymentInfoInput = z.infer<typeof updatePaymentInfoSchema>

export const approveAccountabilityWithPaymentSchema = z.object({
  accountabilityId: z.string().uuid('ID da prestação inválido'),
  dataPagamento: z.string().min(1, 'Data de pagamento é obrigatória'),
  valorPago: z.number().nonnegative('Valor não pode ser negativo'),
})
export type ApproveAccountabilityWithPaymentInput = z.infer<typeof approveAccountabilityWithPaymentSchema>

export const diagnosticLoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const cancelRequestSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  motivo: z.string().min(1, 'Motivo é obrigatório').max(500, 'Motivo deve ter no máximo 500 caracteres'),
})
export type CancelRequestInput = z.infer<typeof cancelRequestSchema>
export type DiagnosticLoginInput = z.infer<typeof diagnosticLoginSchema>

export const updateFinancialValuesSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
  ajudaCustoExtraordinaria: z.number().nonnegative('Valor não pode ser negativo'),
  descontoOutrosAuxilios: z.number().nonnegative('Valor não pode ser negativo'),
  valorAPagar: z.number().nonnegative('Valor não pode ser negativo'),
  reducaoDiarias50: z.boolean().optional(),
  observacoes: z.string().optional(),
})
export type UpdateFinancialValuesInput = z.infer<typeof updateFinancialValuesSchema>
