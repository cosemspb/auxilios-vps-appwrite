import { z } from 'zod'

export const requestIdSchema = z.object({
  requestId: z.string().uuid('ID da solicitação inválido'),
})

const requestSchemaBase = z.object({
  tipo_evento: z.string().min(1, 'Tipo de evento é obrigatório'),
  nome_evento: z.string().min(1, 'Nome do evento é obrigatório'),
  local_evento: z.string().min(1, 'Local do evento é obrigatório'),
  instituicao_executora: z.string().min(1, 'Instituição executora é obrigatória'),
  data_periodo_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_periodo_fim: z.string().min(1, 'Data de fim é obrigatória'),
  cidade_origem: z.string().optional(),
  cidade_destino: z.string().optional(),
  data_partida: z.string().optional(),
  data_retorno: z.string().optional(),
  distancia_id: z.coerce.number().int().positive().nullable().optional(),
  tem_aereo: z.boolean().optional(),
  voo_ida: z.string().optional(),
  voo_volta: z.string().optional(),
  hospedagem_cosems: z.boolean().optional(),
  observacoes: z.string().optional(),
  auxilios_terceiros: z.array(z.object({
    tipo: z.string(),
    quantidade: z.number(),
  })).optional(),
})

export const createRequestSchema = requestSchemaBase.refine(
  (data) => !data.data_partida || !data.data_retorno || data.data_partida <= data.data_retorno,
  { message: 'A data de partida não pode ser posterior à data de retorno', path: ['data_partida'] }
).refine(
  (data) => data.data_periodo_inicio <= data.data_periodo_fim,
  { message: 'A data de início do evento não pode ser posterior à data de fim', path: ['data_periodo_inicio'] }
)
export type CreateRequestInput = z.infer<typeof createRequestSchema>

export const updateRequestSchema = requestSchemaBase.extend({
  request_id: z.string().uuid('ID da solicitação inválido'),
}).refine(
  (data) => !data.data_partida || !data.data_retorno || data.data_partida <= data.data_retorno,
  { message: 'A data de partida não pode ser posterior à data de retorno', path: ['data_partida'] }
).refine(
  (data) => data.data_periodo_inicio <= data.data_periodo_fim,
  { message: 'A data de início do evento não pode ser posterior à data de fim', path: ['data_periodo_inicio'] }
)
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>
