import { formatarValor } from "./mensagem.js";

export interface RecapRodada {
  enviados: { nome: string; valor: number }[];
  pulados: string[];
  falhas: { nome: string; erro: string }[];
}

/**
 * Monta o recap que VOCÊ (dono) recebe no Telegram depois da rodada: quem foi
 * cobrado, quem foi pulado (sem telegramChatId) e quem falhou. Texto puro (sem
 * Markdown) pra nome de cliente nunca quebrar o envio. Puro/testável.
 */
export function montarRecap(r: RecapRodada): string {
  const linhas: string[] = ["📤 Rodada de cobrança"];

  if (r.enviados.length > 0) {
    linhas.push("", `✅ Enviadas (${r.enviados.length}):`);
    for (const e of r.enviados) linhas.push(`• ${e.nome} — R$ ${formatarValor(e.valor)}`);
  }
  if (r.pulados.length > 0) {
    linhas.push("", `⚠️ Sem telegramChatId — pediu /start? (${r.pulados.length}):`);
    for (const nome of r.pulados) linhas.push(`• ${nome}`);
  }
  if (r.falhas.length > 0) {
    linhas.push("", `❌ Falharam (${r.falhas.length}):`);
    for (const f of r.falhas) linhas.push(`• ${f.nome}: ${f.erro}`);
  }

  return linhas.join("\n");
}
