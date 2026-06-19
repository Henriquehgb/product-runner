import type { Config, Estado, Cliente } from "./schema.js";
import { loadConfig } from "./config.js";
import { loadClientes } from "./clientes.js";
import { loadEstado, saveEstado } from "./estado.js";
import { selecionarElegiveis, type Elegivel } from "./services/cobranca/selecao.js";
import { montarCobranca } from "./services/cobranca/cobranca-pronta.js";
import { montarRecap } from "./services/cobranca/resumo.js";
import { marcarLembrados } from "./services/cobranca/marcar.js";
import { enviarMensagem } from "./services/telegram/send.js";

export interface ResultadoRodada {
  estado: Estado;
  enviados: { nome: string; valor: number }[];
  pulados: string[]; // elegíveis sem telegramChatId (não cobrados, não marcados)
  falhas: { nome: string; erro: string }[]; // envio lançou (não marcados → retenta depois)
}

/**
 * Núcleo testável da rodada. `enviar` (mandar texto a um chat) é injetável.
 *
 * Envia a cobrança DIRETO pro Telegram de cada cliente, um por um. Marca como
 * lembrado **só quem recebeu de fato**: quem falha vira `falhas` (retenta na
 * próxima rodada), quem não tem `telegramChatId` vira `pulados`. Assim uma falha
 * num cliente não impede os outros nem marca quem não foi avisado.
 */
export async function executarRodada(args: {
  clientes: Cliente[];
  estado: Estado;
  config: Config;
  hoje: Date;
  enviar: (chatId: string, texto: string) => Promise<void>;
}): Promise<ResultadoRodada> {
  const { clientes, estado, config, hoje, enviar } = args;

  const elegiveis = selecionarElegiveis({
    clientes,
    estado,
    hoje,
    diasAntecedencia: config.diasAntecedencia,
  });

  const enviados: Elegivel[] = [];
  const pulados: string[] = [];
  const falhas: { nome: string; erro: string }[] = [];

  for (const elegivel of elegiveis) {
    const { cliente } = elegivel;
    if (!cliente.telegramChatId) {
      pulados.push(cliente.nome);
      continue;
    }
    const cobranca = montarCobranca(elegivel, config);
    try {
      await enviar(cliente.telegramChatId, cobranca.mensagem);
      enviados.push(elegivel);
    } catch (e) {
      falhas.push({ nome: cliente.nome, erro: (e as Error).message });
    }
  }

  // Marca só os que receberam — falhas/pulados continuam elegíveis na próxima.
  const novoEstado = marcarLembrados(estado, enviados, hoje);

  return {
    estado: novoEstado,
    enviados: enviados.map((e) => ({ nome: e.cliente.nome, valor: e.cliente.valorMensal })),
    pulados,
    falhas,
  };
}

/** Wrapper de IO: carrega tudo, roda, persiste sucessos, manda recap ao dono. */
async function main(): Promise<void> {
  const config = loadConfig();
  const clientes = loadClientes();
  const estado = loadEstado();

  const r = await executarRodada({
    clientes,
    estado,
    config,
    hoje: new Date(),
    enviar: (chatId, texto) => enviarMensagem(config.telegramBotToken, chatId, texto),
  });

  // Só houve mudança de estado se algo foi marcado (enviado com sucesso).
  if (r.enviados.length > 0) saveEstado(r.estado);

  // Recap pra você no seu chat — só quando há algo a relatar.
  if (r.enviados.length + r.pulados.length + r.falhas.length > 0) {
    try {
      await enviarMensagem(config.telegramBotToken, config.telegramChatId, montarRecap(r));
    } catch (e) {
      console.error(`Aviso: recap ao dono falhou: ${(e as Error).message}`);
    }
  }

  console.log(
    `Enviadas: ${r.enviados.length} · puladas (sem telegramChatId): ${r.pulados.length} · falhas: ${r.falhas.length}.`,
  );

  // Falha de envio sai ≠ 0 pra alertar no cron — mas o estado já foi persistido
  // acima (o passo de commit do workflow roda com `if: always()`).
  if (r.falhas.length > 0) {
    for (const f of r.falhas) console.error(`  ✗ ${f.nome}: ${f.erro}`);
    process.exit(1);
  }
}

// Só executa o IO quando rodado direto (não ao ser importado nos testes).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`FATAL: rodada falhou: ${(e as Error).message}`);
    process.exit(1);
  });
}
