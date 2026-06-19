import { describe, it, expect } from "vitest";
import type { Cliente, Estado } from "../src/schema.js";
import { selecionarElegiveis } from "../src/services/cobranca/selecao.js";
import { crc16, gerarPixCopiaECola } from "../src/services/cobranca/pix.js";
import { montarMensagem } from "../src/services/cobranca/mensagem.js";
import { montarLinkWaMe } from "../src/services/cobranca/whatsapp.js";

const joao: Cliente = {
  nome: "João Silva",
  telefone: "+5511999990000",
  valorMensal: 150,
  diaVencimento: 10,
  ativo: true,
};
const estadoVazio: Estado = { cobrancas: [] };

describe("selecionarElegiveis", () => {
  it("inclui quem vence dentro da janela (07/06 + 3 pega o João dia 10)", () => {
    const r = selecionarElegiveis({
      clientes: [joao],
      estado: estadoVazio,
      hoje: new Date(2026, 5, 7),
      diasAntecedencia: 3,
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.cliente.nome).toBe("João Silva");
  });

  it("borda inclusive: vencimento == hoje + diasAntecedencia entra", () => {
    const r = selecionarElegiveis({
      clientes: [joao],
      estado: estadoVazio,
      hoje: new Date(2026, 5, 7), // 07 + 3 = 10 == vencimento
      diasAntecedencia: 3,
    });
    expect(r).toHaveLength(1);
  });

  it("fora da janela: vence além de hoje + diasAntecedencia não entra", () => {
    const r = selecionarElegiveis({
      clientes: [joao],
      estado: estadoVazio,
      hoje: new Date(2026, 5, 1), // 01 + 3 = 04 < 10
      diasAntecedencia: 3,
    });
    expect(r).toHaveLength(0);
  });

  it("idempotência: já lembrado na competência é pulado", () => {
    const estado: Estado = {
      cobrancas: [
        {
          clienteId: joao.telefone,
          competencia: "2026-06",
          status: "lembrado",
          dataLembrete: "2026-06-07",
        },
      ],
    };
    const r = selecionarElegiveis({
      clientes: [joao],
      estado,
      hoje: new Date(2026, 5, 7),
      diasAntecedencia: 3,
    });
    expect(r).toHaveLength(0);
  });

  it("ignora clientes inativos", () => {
    const r = selecionarElegiveis({
      clientes: [{ ...joao, ativo: false }],
      estado: estadoVazio,
      hoje: new Date(2026, 5, 7),
      diasAntecedencia: 3,
    });
    expect(r).toHaveLength(0);
  });
});

describe("crc16 / Pix", () => {
  it("CRC16-CCITT-FALSE do vetor canônico '123456789' é 29B1", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("o BR Code gerado fecha com CRC consistente sobre o próprio payload", () => {
    const code = gerarPixCopiaECola({
      chave: "joao@prestador.com",
      nome: "Maria Prestadora",
      cidade: "SAO PAULO",
      valor: 150,
    });
    expect(code.startsWith("000201")).toBe(true);
    const semCrc = code.slice(0, -4);
    expect(semCrc.endsWith("6304")).toBe(true);
    expect(code.slice(-4)).toBe(crc16(semCrc));
  });

  it("o valor entra no campo 54 com 2 casas", () => {
    const code = gerarPixCopiaECola({ chave: "x", nome: "M", cidade: "SP", valor: 150 });
    expect(code).toContain("5406150.00");
  });
});

describe("montarMensagem", () => {
  it("produz exatamente o template confirmado", () => {
    const msg = montarMensagem({
      nome: "João Silva",
      vencimento: new Date(2026, 5, 10),
      valor: 150,
      pix: "PIXCODE",
    });
    expect(msg).toBe(
      "Olá, João Silva! Passando pra lembrar da mensalidade de junho, no valor de R$ 150,00, " +
        "com vencimento em 10/06. Você pode pagar via Pix (copia e cola): PIXCODE. " +
        "Qualquer dúvida, é só chamar. Obrigado!",
    );
  });
});

describe("montarLinkWaMe", () => {
  it("usa número sem símbolos e texto urlencoded", () => {
    const link = montarLinkWaMe("+5511999990000", "olá mundo");
    expect(link).toBe("https://wa.me/5511999990000?text=ol%C3%A1%20mundo");
  });

  it("escapa ()!'* — parênteses crus quebram o markdown link do Telegram", () => {
    const link = montarLinkWaMe("+5511999990000", "Pix (copia e cola)!");
    // a URL inteira não pode conter parêntese cru (wa.me não tem parêntese no host).
    expect(link).not.toMatch(/[()]/);
    expect(link).toContain("%28"); // (
    expect(link).toContain("%29"); // )
  });
});
