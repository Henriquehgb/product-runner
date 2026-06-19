import { loadConfig } from "./config.js";
import { loadClientes } from "./clientes.js";
import { loadEstado } from "./estado.js";

/** Entrypoint de fumaça: carrega e valida tudo, reporta o estado. */
function main(): void {
  const config = loadConfig();
  const clientes = loadClientes();
  const estado = loadEstado();

  const ativos = clientes.filter((c) => c.ativo);
  console.log(`Config OK (recebedor: ${config.nomeRecebedor}/${config.cidadeRecebedor}).`);
  console.log(`${ativos.length} cliente(s) ativo(s) de ${clientes.length} cadastrado(s).`);
  console.log(`Estado: ${estado.cobrancas.length} cobrança(s) registrada(s).`);
}

main();
