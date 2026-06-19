import { describe, it, expect } from "vitest";
import { ClienteSchema } from "../src/schema.js";

describe("ClienteSchema", () => {
  it("aceita cliente válido", () => {
    const r = ClienteSchema.safeParse({
      nome: "João Silva",
      telefone: "+5511999990000",
      valorMensal: 150,
      diaVencimento: 10,
      ativo: true,
    });
    expect(r.success).toBe(true);
  });

  it("aceita cliente com telegramChatId (opcional)", () => {
    const r = ClienteSchema.safeParse({
      nome: "Bruno",
      telefone: "+5511988887777",
      telegramChatId: "987654321",
      valorMensal: 200,
      diaVencimento: 5,
      ativo: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejeita telefone fora de E.164", () => {
    const r = ClienteSchema.safeParse({
      nome: "X",
      telefone: "11999990000",
      valorMensal: 150,
      diaVencimento: 10,
      ativo: true,
    });
    expect(r.success).toBe(false);
  });
});
