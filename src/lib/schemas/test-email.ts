import { z } from 'zod'

export const sendTestTemplateEmailSchema = z.object({
  templateKey: z.string().min(1, 'Template é obrigatório'),
})
export type SendTestTemplateEmailInput = z.infer<typeof sendTestTemplateEmailSchema>
