import { z } from "zod";

/** Cliente: um valor mensal por cliente (decisão do Gate 1). */
export const ClienteSchema = z.object({
  nome: z.string().min(1),
  // E.164: + seguido de 12 a 13 dígitos (BR: +55 + DDD + 8/9 dígitos).
  telefone: z.string().regex(/^\+\d{12,13}$/, "telefone deve ser E.164, ex: +5511999990000"),
  // chat_id do Telegram do cliente (o número, como string). OPCIONAL: sem ele a
  // rodada pula o cliente e avisa no recap. O cliente precisa dar /start no bot
  // antes; descubra o chat_id com `npm run telegram:chats`.
  telegramChatId: z.string().min(1).optional(),
  valorMensal: z.number().positive(),
  diaVencimento: z.number().int().min(1).max(31),
  ativo: z.boolean(),
});
export type Cliente = z.infer<typeof ClienteSchema>;

export const ClientesSchema = z.array(ClienteSchema);

/** Config global (singleton) — lida de env/secrets, nunca do JSON versionado. */
export const ConfigSchema = z.object({
  chavePix: z.string().min(1),
  nomeRecebedor: z.string().min(1).max(25), // limite do campo 59 do BR Code
  cidadeRecebedor: z.string().min(1).max(15), // limite do campo 60 do BR Code
  telegramBotToken: z.string().min(1),
  telegramChatId: z.string().min(1),
  diasAntecedencia: z.number().int().min(0),
});
export type Config = z.infer<typeof ConfigSchema>;

/** Estado persistido: histórico mínimo para idempotência. */
export const StatusCobranca = z.enum(["pendente", "lembrado"]);
export type StatusCobranca = z.infer<typeof StatusCobranca>;

export const CobrancaSchema = z.object({
  clienteId: z.string(), // usamos o telefone como id estável
  competencia: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  status: StatusCobranca,
  dataLembrete: z.string().nullable(),
});
export type Cobranca = z.infer<typeof CobrancaSchema>;

export const EstadoSchema = z.object({
  cobrancas: z.array(CobrancaSchema),
});
export type Estado = z.infer<typeof EstadoSchema>;

export const ESTADO_VAZIO: Estado = { cobrancas: [] };
