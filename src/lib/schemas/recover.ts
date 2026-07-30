import { z } from 'zod'

export const recoverPasswordSchema = z.object({
  cpf: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido'),
})
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>
