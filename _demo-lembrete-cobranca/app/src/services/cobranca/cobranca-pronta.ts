import type { Config } from "../../schema.js";
import type { Elegivel } from "./selecao.js";
import { gerarPixCopiaECola } from "./pix.js";
import { montarMensagem } from "./mensagem.js";
import { montarLinkWaMe } from "./whatsapp.js";

export interface CobrancaPronta {
  elegivel: Elegivel;
  pixCopiaECola: string;
  mensagem: string;
  linkWhatsApp: string;
}

/** Monta a cobrança pronta (Pix + mensagem + link) de um elegível. Pura. */
export function montarCobranca(elegivel: Elegivel, config: Config): CobrancaPronta {
  const { cliente, vencimento } = elegivel;
  const pix = gerarPixCopiaECola({
    chave: config.chavePix,
    nome: config.nomeRecebedor,
    cidade: config.cidadeRecebedor,
    valor: cliente.valorMensal,
  });
  const mensagem = montarMensagem({
    nome: cliente.nome,
    vencimento,
    valor: cliente.valorMensal,
    pix,
  });
  return {
    elegivel,
    pixCopiaECola: pix,
    mensagem,
    linkWhatsApp: montarLinkWaMe(cliente.telefone, mensagem),
  };
}
