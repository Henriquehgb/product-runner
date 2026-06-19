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
  telegramChatId: "111",
  valorMensal: 150,
  diaVencimento: 10,
  ativo: true,
};
const hoje = new Date(2026, 5, 7);
const vazio: Estado = { cobrancas: [] };

describe("executarRodada", () => {
  it("envia a cobrança direto pro Telegram do cliente e marca lembrado", async () => {
    const enviadas: { chatId: string; texto: string }[] = [];
    const r = await executarRodada({
      clientes: [joao],
      estado: vazio,
      config,
      hoje,
      enviar: async (chatId, texto) => {
        enviadas.push({ chatId, texto });
      },
    });
    expect(enviadas).toHaveLength(1);
    expect(enviadas[0]!.chatId).toBe("111"); // chat_id do cliente, não o do dono
    expect(enviadas[0]!.texto).toContain("João Silva");
    expect(enviadas[0]!.texto).toContain("Pix"); // mensagem self-contained (Pix inline)
    expect(r.enviados).toEqual([{ nome: "João Silva", valor: 150 }]);
    expect(r.pulados).toHaveLength(0);
    expect(r.falhas).toHaveLength(0);
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
    expect(chamou).toBe(false);
    expect(r.enviados).toHaveLength(0);
  });

  it("pula cliente sem telegramChatId: não envia, não marca, lista em pulados", async () => {
    let chamou = false;
    const semChat: Cliente = { ...joao, telegramChatId: undefined };
    const r = await executarRodada({
      clientes: [semChat],
      estado: vazio,
      config,
      hoje,
      enviar: async () => {
        chamou = true;
      },
    });
    expect(chamou).toBe(false);
    expect(r.pulados).toEqual(["João Silva"]);
    expect(r.enviados).toHaveLength(0);
    expect(r.estado.cobrancas).toHaveLength(0); // não marcado → retenta na próxima
  });

  it("falha em um cliente NÃO marca esse e NÃO impede os outros", async () => {
    const maria: Cliente = {
      ...joao,
      nome: "Maria",
      telefone: "+5511888880000",
      telegramChatId: "222",
    };
    const r = await executarRodada({
      clientes: [joao, maria],
      estado: vazio,
      config,
      hoje,
      enviar: async (chatId) => {
        if (chatId === "111") throw new Error("telegram 403");
      },
    });
    expect(r.falhas).toEqual([{ nome: "João Silva", erro: "telegram 403" }]);
    expect(r.enviados).toEqual([{ nome: "Maria", valor: 150 }]);
    // só a Maria foi marcada; o João continua elegível
    expect(r.estado.cobrancas).toHaveLength(1);
    expect(r.estado.cobrancas[0]!.clienteId).toBe(maria.telefone);
    // estado original intacto (pureza)
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
