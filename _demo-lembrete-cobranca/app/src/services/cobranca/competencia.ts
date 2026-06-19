/** Competência (YYYY-MM) de uma data. */
export function competenciaAtual(hoje: Date): string {
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

/** Último dia do mês da competência (para clampar diaVencimento). */
export function ultimoDiaDoMes(hoje: Date): number {
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
}

/** Data de vencimento na competência de `hoje`, clampando o dia ao fim do mês. */
export function vencimentoNaCompetencia(hoje: Date, diaVencimento: number): Date {
  const dia = Math.min(diaVencimento, ultimoDiaDoMes(hoje));
  return new Date(hoje.getFullYear(), hoje.getMonth(), dia);
}
