import type { Estado } from "../../schema.js";
import type { Elegivel } from "./selecao.js";

function dataISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Marca os elegíveis como "lembrado" na competência. Pura: retorna NOVO estado.
 * Idempotente: não duplica cobrança já registrada na competência.
 */
export function marcarLembrados(estado: Estado, elegiveis: Elegivel[], hoje: Date): Estado {
  const cobrancas = estado.cobrancas.map((c) => ({ ...c }));
  for (const e of elegiveis) {
    const id = e.cliente.telefone;
    const existente = cobrancas.find((c) => c.clienteId === id && c.competencia === e.competencia);
    if (existente) {
      existente.status = "lembrado";
      existente.dataLembrete = dataISO(hoje);
    } else {
      cobrancas.push({
        clienteId: id,
        competencia: e.competencia,
        status: "lembrado",
        dataLembrete: dataISO(hoje),
      });
    }
  }
  return { cobrancas };
}
