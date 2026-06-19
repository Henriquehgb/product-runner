import { loadConfig } from "./config.js";
import { loadClientes } from "./clientes.js";
import { loadEstado } from "./estado.js";
import { selecionarElegiveis } from "./services/cobranca/selecao.js";
import { montarCobranca } from "./services/cobranca/cobranca-pronta.js";
import { formatarValor, formatarDataDDMM } from "./services/cobranca/mensagem.js";

/** Imprime as cobranças prontas de hoje, sem enviar nada. */
function main(): void {
  const config = loadConfig();
  const clientes = loadClientes();
  const estado = loadEstado();
  const hoje = new Date();

  const elegiveis = selecionarElegiveis({
    clientes,
    estado,
    hoje,
    diasAntecedencia: config.diasAntecedencia,
  });

  if (elegiveis.length === 0) {
    console.log("Nenhum cliente a cobrar hoje.");
    return;
  }

  console.log(`${elegiveis.length} cobrança(s) pronta(s):\n`);
  for (const elegivel of elegiveis) {
    const c = montarCobranca(elegivel, config);
    console.log(
      `• ${c.elegivel.cliente.nome} — R$ ${formatarValor(c.elegivel.cliente.valorMensal)}`,
    );
    console.log(`  vence ${formatarDataDDMM(c.elegivel.vencimento)}`);
    console.log(`  WhatsApp: ${c.linkWhatsApp}`);
    console.log(`  Pix: ${c.pixCopiaECola}\n`);
  }
}

main();
