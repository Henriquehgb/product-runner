import { describe, it, expect } from "vitest";
import type { Cliente, Config, Estado } from "../src/schema.js";
import { executarRodada } from "../src/rodada.js";
import { marcarLembrados } from "../src/services/cobranca/marcar.js";
import type { Elegivel } from "../src/services/cobranca/selecao.js";

const config: Config = {
  chavePix: "joao@prestador.com",
  nomeRecebedor: "Maria Prestadora",
  cidadeRecebedor: "SAO PAULO",
  telegramBotToken: "t",
  telegramChatId: "1",
  diasAntecedencia: 3,
};
const joao: Cliente = {
  nome: "João Silva",
  telefone: "+5511999990000",
  valorMensal: 150,
  diaVencimento: 10,
  ativo: true,
};
const hoje = new Date(2026, 5, 7);
const vazio: Estado = { cobrancas: [] };

describe("executarRodada", () => {
  it("envia e marca lembrado quando há elegível", async () => {
    let enviado: string | null = null;
    const r = await executarRodada({
      clientes: [joao],
      estado: vazio,
      config,
      hoje,
      enviar: async (t) => {
        enviado = t;
      },
    });
    expect(r.enviou).toBe(true);
    expect(r.quantidade).toBe(1);
    expect(enviado).toContain("João Silva");
    expect(r.estado.cobrancas[0]).toMatchObject({
      clienteId: joao.telefone,
      competencia: "2026-06",
      status: "lembrado",
    });
  });

  it("não envia nada quando não há elegível", async () => {
    let chamou = false;
    const r = await executarRodada({
      clientes: [{ ...joao, ativo: false }],
      estado: vazio,
      config,
      hoje,
      enviar: async () => {
        chamou = true;
      },
    });
    expect(r.enviou).toBe(false);
    expect(chamou).toBe(false);
  });

  it("se o envio falha, NÃO marca ninguém como lembrado", async () => {
    const r = executarRodada({
      clientes: [joao],
      estado: vazio,
      config,
      hoje,
      enviar: async () => {
        throw new Error("telegram down");
      },
    });
    await expect(r).rejects.toThrow("telegram down");
    // estado original permanece intacto (nada marcado)
    expect(vazio.cobrancas).toHaveLength(0);
  });
});

describe("marcarLembrados", () => {
  it("é puro: não muta o estado original", () => {
    const original: Estado = { cobrancas: [] };
    const elegivel: Elegivel = {
      cliente: joao,
      competencia: "2026-06",
      vencimento: new Date(2026, 5, 10),
    };
    const novo = marcarLembrados(original, [elegivel], hoje);
    expect(original.cobrancas).toHaveLength(0);
    expect(novo.cobrancas).toHaveLength(1);
    expect(novo.cobrancas[0]!.status).toBe("lembrado");
  });
});
