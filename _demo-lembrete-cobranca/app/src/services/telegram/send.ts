import { z } from "zod";

const TelegramResponseSchema = z.object({ ok: z.literal(true) });

/**
 * Envia uma mensagem de texto a um chat via Bot API. Lança em falha
 * (assim a rodada não marca como lembrado quem não recebeu de fato).
 *
 * Texto puro (sem `parse_mode`): a mensagem da cobrança traz o Pix copia-e-cola
 * inline, e texto puro garante que ele copie limpo e que nada quebre o parser
 * (foi o que mordeu o resumo com Markdown — ver `whatsapp.ts`/open-issue #5).
 */
export async function enviarMensagem(token: string, chatId: string, texto: string): Promise<void> {
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      disable_web_page_preview: true,
    }),
  });

  const data: unknown = await resp.json().catch(() => ({}));
  const parsed = TelegramResponseSchema.safeParse(data);
  if (!resp.ok || !parsed.success) {
    throw new Error(`Telegram falhou (HTTP ${resp.status}): ${JSON.stringify(data)}`);
  }
}
