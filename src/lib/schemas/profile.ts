import { z } from 'zod'

export const updateProfileSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria_id: z.coerce.number().int().positive('Categoria é obrigatória'),
  necessidades_especiais: z.string().nullable().optional(),
  banco: z.string().nullable().optional(),
  agencia: z.string().nullable().optional(),
  conta: z.string().nullable().optional(),
  pix: z.string().nullable().optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
