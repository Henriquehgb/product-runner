import fs from "node:fs";
import { EstadoSchema, ESTADO_VAZIO, type Estado } from "./schema.js";

const ESTADO_PATH = process.env.ESTADO_PATH ?? "estado.json";

/** Carrega o estado; se ausente, retorna estado vazio (primeira execução). */
export function loadEstado(path: string = ESTADO_PATH): Estado {
  if (!fs.existsSync(path)) return structuredClone(ESTADO_VAZIO);
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch (e) {
    console.error(`FATAL: ${path} não é JSON válido: ${(e as Error).message}`);
    process.exit(1);
  }
  const result = EstadoSchema.safeParse(raw);
  if (!result.success) {
    console.error(`FATAL: ${path} inválido`);
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}

/** Persiste o estado validado. */
export function saveEstado(estado: Estado, path: string = ESTADO_PATH): void {
  const validated = EstadoSchema.parse(estado);
  fs.writeFileSync(path, JSON.stringify(validated, null, 2) + "\n", "utf-8");
}
