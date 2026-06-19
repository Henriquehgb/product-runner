import fs from "node:fs";
import { ClientesSchema, type Cliente } from "./schema.js";

const CLIENTES_PATH = process.env.CLIENTES_PATH ?? "clientes.json";

/**
 * Carrega e valida a lista de clientes. Fail-fast em ausência/malformação.
 */
export function loadClientes(path: string = CLIENTES_PATH): Cliente[] {
  if (!fs.existsSync(path)) {
    console.error(`FATAL: arquivo de clientes não encontrado: ${path}`);
    process.exit(1);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch (e) {
    console.error(`FATAL: ${path} não é JSON válido: ${(e as Error).message}`);
    process.exit(1);
  }
  const result = ClientesSchema.safeParse(raw);
  if (!result.success) {
    console.error(`FATAL: ${path} inválido`);
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}
