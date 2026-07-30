import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const completeRegistrationSchema = z.object({
  cpf: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido'),
  whatsapp: z.string().regex(/^\d{10,11}$/, 'WhatsApp inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  passwordConfirm: z.string().min(1, 'Confirmação de senha é obrigatória'),
  categoria_id: z.string().min(1, 'Selecione uma categoria'),
  banco: z.string().optional().nullable(),
  agencia: z.string().optional().nullable(),
  conta: z.string().optional().nullable(),
  pix: z.string().optional().nullable(),
}).refine(data => data.password === data.passwordConfirm, {
  message: 'Senhas não coincidem',
  path: ['passwordConfirm'],
}).refine(data => {
  const hasBank = data.banco || data.agencia || data.conta
  const hasPix = !!data.pix
  return hasBank || hasPix
}, {
  message: 'Preencha os dados bancários ou a chave PIX',
  path: ['banco'],
})
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>

export const requestPasswordResetSchema = z.object({
  email: z.string().email('E-mail inválido'),
})
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>

export const updatePasswordSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
})
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
