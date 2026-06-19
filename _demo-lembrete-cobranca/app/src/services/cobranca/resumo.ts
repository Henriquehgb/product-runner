import type { CobrancaPronta } from "./cobranca-pronta.js";
import { formatarValor, formatarDataDDMM } from "./mensagem.js";

/** Monta o texto do resumo enviado a você no Telegram (Markdown). Puro. */
export function montarResumo(cobrancas: CobrancaPronta[]): string {
  const linhas: string[] = [`💰 *${cobrancas.length} cobrança(s) a enviar hoje*`, ""];
  for (const c of cobrancas) {
    const { cliente } = c.elegivel;
    linhas.push(
      `*${cliente.nome}* — R$ ${formatarValor(cliente.valorMensal)} ` +
        `(vence ${formatarDataDDMM(c.elegivel.vencimento)})`,
      `📲 [Enviar no WhatsApp](${c.linkWhatsApp})`,
      `🔑 Pix: \`${c.pixCopiaECola}\``,
      "",
    );
  }
  return linhas.join("\n").trimEnd();
}
