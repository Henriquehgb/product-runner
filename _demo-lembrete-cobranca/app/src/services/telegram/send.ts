import { z } from "zod";

const TelegramResponseSchema = z.object({ ok: z.literal(true) });

/** Envia uma mensagem ao chat via Bot API. Lança em falha (não marcar lembrado se falhar). */
export async function enviarResumo(token: string, chatId: string, texto: string): Promise<void> {
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  const data: unknown = await resp.json().catch(() => ({}));
  const parsed = TelegramResponseSchema.safeParse(data);
  if (!resp.ok || !parsed.success) {
    throw new Error(`Telegram falhou (HTTP ${resp.status}): ${JSON.stringify(data)}`);
  }
}
