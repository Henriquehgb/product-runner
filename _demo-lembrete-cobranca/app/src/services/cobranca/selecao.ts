import type { Cliente, Estado } from "../../schema.js";
import { competenciaAtual, vencimentoNaCompetencia } from "./competencia.js";

export interface Elegivel {
  cliente: Cliente;
  competencia: string;
  vencimento: Date;
}

/** Diferença em dias inteiros (b - a), ignorando horário. */
function diffEmDias(a: Date, b: Date): number {
  const umDia = 24 * 60 * 60 * 1000;
  const ax = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bx = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bx - ax) / umDia);
}

/**
 * Seleciona quem deve ser lembrado hoje (função pura).
 *
 * Regras (confirmadas nos gates):
 * - Só clientes ativos.
 * - Janela INCLUSIVE: vencimento <= hoje + diasAntecedencia (o dia conta).
 *   Também inclui já vencidos no mês (vencimento <= hoje).
 * - Idempotência: pula quem já tem cobrança "lembrado" na competência atual.
 */
export function selecionarElegiveis(args: {
  clientes: Cliente[];
  estado: Estado;
  hoje: Date;
  diasAntecedencia: number;
}): Elegivel[] {
  const { clientes, estado, hoje, diasAntecedencia } = args;
  const competencia = competenciaAtual(hoje);

  const jaLembrado = new Set(
    estado.cobrancas
      .filter((c) => c.competencia === competencia && c.status === "lembrado")
      .map((c) => c.clienteId),
  );

  const elegiveis: Elegivel[] = [];
  for (const cliente of clientes) {
    if (!cliente.ativo) continue;
    if (jaLembrado.has(cliente.telefone)) continue;

    const vencimento = vencimentoNaCompetencia(hoje, cliente.diaVencimento);
    const dias = diffEmDias(hoje, vencimento);
    // dias <= diasAntecedencia cobre futuro dentro da janela E vencidos (dias < 0).
    if (dias <= diasAntecedencia) {
      elegiveis.push({ cliente, competencia, vencimento });
    }
  }
  return elegiveis;
}
