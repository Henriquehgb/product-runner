import { z } from "zod";

/**
 * getUpdates: só enxerga quem JÁ falou com o bot (deu /start ou mandou msg).
 * O bot não consegue iniciar conversa nem achar alguém por telefone — é assim
 * que o Telegram protege o usuário. Por isso o cliente precisa dar /start antes.
 */
const UpdatesSchema = z.object({
  ok: z.literal(true),
  result: z.array(
    z.object({
      message: z
        .object({
          chat: z.object({
            id: z.number(),
            type: z.string(),
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            username: z.string().optional(),
            title: z.string().optional(),
          }),
        })
        .optional(),
    }),
  ),
});

export interface ChatInfo {
  id: number;
  nome: string;
  tipo: string;
}

/** Lista (deduplicado) os chats que já conversaram com o bot. Lança em falha. */
export async function listarChats(token: string): Promise<ChatInfo[]> {
  const resp = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data: unknown = await resp.json().catch(() => ({}));
  const parsed = UpdatesSchema.safeParse(data);
  if (!resp.ok || !parsed.success) {
    throw new Error(`getUpdates falhou (HTTP ${resp.status}): ${JSON.stringify(data)}`);
  }

  const porId = new Map<number, ChatInfo>();
  for (const u of parsed.data.result) {
    const chat = u.message?.chat;
    if (!chat) continue;
    const nomeCompleto = chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ");
    const nome = chat.username ? `@${chat.username}` : nomeCompleto || "(sem nome)";
    porId.set(chat.id, { id: chat.id, nome, tipo: chat.type });
  }
  return [...porId.values()];
}
