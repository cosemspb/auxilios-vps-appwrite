import { z } from 'zod'

const smtpConnectionSchema = z.object({
  smtp_host: z.string().min(1, 'Host SMTP é obrigatório'),
  smtp_port: z.number().int().min(1).max(65535, 'Porta inválida'),
  smtp_user: z.string().min(1, 'Usuário SMTP é obrigatório'),
  smtp_password: z.string().optional().default(''),
  smtp_secure: z.boolean(),
})

export const smtpConfigSchema = smtpConnectionSchema.extend({
  smtp_from_email: z.string().email('E-mail de remetente inválido'),
  smtp_from_name: z.string().min(1, 'Nome de remetente é obrigatório'),
  emails_notificacao_novos_pedidos: z.string().optional(),
  emails_notificacao_rede: z.string().optional(),
  test_email_config: z.string().optional(),
})
export type SmtpConfigInput = z.infer<typeof smtpConfigSchema>
export const saveSmtpConfigSchema = smtpConfigSchema

export const testSmtpConnectionConfigSchema = smtpConnectionSchema
export type TestSmtpConnectionConfigInput = z.infer<typeof testSmtpConnectionConfigSchema>

export const testSmtpConfigActionSchema = z.object({
  config: testSmtpConnectionConfigSchema.optional(),
  to: z.string().email('E-mail de destino inválido').optional(),
})
export type TestSmtpConfigActionInput = z.infer<typeof testSmtpConfigActionSchema>

export const toggleSmtpActiveSchema = z.object({
  ativo: z.boolean(),
})
export type ToggleSmtpActiveInput = z.infer<typeof toggleSmtpActiveSchema>
