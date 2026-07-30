import { z } from 'zod'

export const paymentReportSchema = z.object({
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})
export type PaymentReportInput = z.infer<typeof paymentReportSchema>

export const paidRequestsReportSchema = z.object({
  startDate: z.string().min(1, 'Data inicial é obrigatória'),
  endDate: z.string().min(1, 'Data final é obrigatória'),
  categoryIds: z.array(z.string()).optional().default([]),
  requesterCpfs: z.array(z.string()).optional().default([]),
})
export type PaidRequestsReportInput = z.infer<typeof paidRequestsReportSchema>
