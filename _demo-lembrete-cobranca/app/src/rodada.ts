import type { Config, Estado, Cliente } from "./schema.js";
import { loadConfig } from "./config.js";
import { loadClientes } from "./clientes.js";
import { loadEstado, saveEstado } from "./estado.js";
import { selecionarElegiveis } from "./services/cobranca/selecao.js";
import { montarCobranca } from "./services/cobranca/cobranca-pronta.js";
import { montarResumo } from "./services/cobranca/resumo.js";
import { marcarLembrados } from "./services/cobranca/marcar.js";
import { enviarResumo } from "./services/telegram/send.js";

export interface ResultadoRodada {
  enviou: boolean;
  estado: Estado;
  quantidade: number;
}

/**
 * Núcleo testável da rodada. `enviar` é injetável.
 * Ordem deliberada: envia ANTES de marcar — se o envio falhar (throw),
 * o estado NÃO é alterado e ninguém é marcado como lembrado.
 */
export async function executarRodada(args: {
  clientes: Cliente[];
  estado: Estado;
  config: Config;
  hoje: Date;
  enviar: (texto: string) => Promise<void>;
}): Promise<ResultadoRodada> {
  const { clientes, estado, config, hoje, enviar } = args;

  const elegiveis = selecionarElegiveis({
    clientes,
    estado,
    hoje,
    diasAntecedencia: config.diasAntecedencia,
  });

  if (elegiveis.length === 0) {
    return { enviou: false, estado, quantidade: 0 };
  }

  const cobrancas = elegiveis.map((e) => montarCobranca(e, config));
  await enviar(montarResumo(cobrancas)); // pode lançar — interrompe antes de marcar

  const novoEstado = marcarLembrados(estado, elegiveis, hoje);
  return { enviou: true, estado: novoEstado, quantidade: elegiveis.length };
}

/** Wrapper de IO: carrega tudo, roda, persiste só se enviou. */
async function main(): Promise<void> {
  const config = loadConfig();
  const clientes = loadClientes();
  const estado = loadEstado();

  const r = await executarRodada({
    clientes,
    estado,
    config,
    hoje: new Date(),
    enviar: (texto) => enviarResumo(config.telegramBotToken, config.telegramChatId, texto),
  });

  if (r.enviou) {
    saveEstado(r.estado);
    console.log(`Resumo enviado: ${r.quantidade} cobrança(s). Estado atualizado.`);
  } else {
    console.log("Nenhum cliente a cobrar hoje. Nada enviado.");
  }
}

// Só executa o IO quando rodado direto (não ao ser importado nos testes).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`FATAL: rodada falhou: ${(e as Error).message}`);
    process.exit(1);
  });
}
