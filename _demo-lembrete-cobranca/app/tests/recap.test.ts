import { describe, it, expect } from "vitest";
import { montarRecap } from "../src/services/cobranca/resumo.js";

describe("montarRecap", () => {
  it("lista enviadas, puladas e falhas", () => {
    const txt = montarRecap({
      enviados: [{ nome: "João Silva", valor: 150 }],
      pulados: ["Maria"],
      falhas: [{ nome: "Pedro", erro: "HTTP 403" }],
    });
    expect(txt).toContain("Enviadas (1)");
    expect(txt).toContain("João Silva — R$ 150,00");
    expect(txt).toContain("Sem telegramChatId");
    expect(txt).toContain("• Maria");
    expect(txt).toContain("Pedro: HTTP 403");
  });

  it("omite seções vazias", () => {
    const txt = montarRecap({ enviados: [{ nome: "A", valor: 10 }], pulados: [], falhas: [] });
    expect(txt).toContain("Enviadas (1)");
    expect(txt).not.toContain("Sem telegramChatId");
    expect(txt).not.toContain("Falharam");
  });
});
