import { readdir, readFile, rename, mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join, dirname } from "node:path";

// --- Migrations ------------------------------------------------------------
//
// Uma migration descreve como levar um projeto de uma versao dos templates
// para a proxima -- o que o diff de estado (manifesto) nao expressa: renames,
// splits, mudancas de convencao, transformacoes acopladas a codigo.
//
// Formato do arquivo `migrations/<x.y.z>.md`: frontmatter JSON entre `---`,
// seguido do corpo em markdown (as instrucoes conduzidas). JSON (nao YAML)
// porque o pacote e zero-dependencia e JSON.parse e robusto.
//
//   ---
//   { "version": "0.3.0", "previous": "0.2.3", "title": "...",
//     "risk": "high", "autoApply": false, "ops": [ ... ] }
//   ---
//   <prosa markdown: o que mudou e como conduzir>

export type OpType = "rename" | "replace";

export interface MigrationOp {
  type: OpType;
  /** rename: caminho de origem (relativo ao projeto, POSIX). */
  from?: string;
  /** rename: caminho de destino. */
  to?: string;
  /** replace: glob dos arquivos alvo. */
  glob?: string;
  /** replace: regex (string) a procurar. */
  find?: string;
  /** replace: texto de substituicao. */
  replace?: string;
}

export interface Migration {
  version: string;
  previous?: string;
  title: string;
  risk?: "low" | "high";
  /** true = o CLI aplica os `ops` sozinho; false = so apresenta, LLM conduz. */
  autoApply: boolean;
  affects: string[];
  ops: MigrationOp[];
  /** Corpo em markdown (instrucoes conduzidas). */
  body: string;
}

/** Nome de arquivo de migration: exatamente `x.y.z.md`. */
const VERSION_FILE_RE = /^\d+\.\d+\.\d+\.md$/;

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Compara versoes semver simples (x.y.z): <0, 0, >0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Converte glob simples (`*` num segmento, `**` atravessa) em RegExp. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          // `**/` atravessa zero ou mais segmentos (inclui a barra)
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i++;
        }
      } else {
        re += "[^/]*";
      }
    } else if (/[.+^${}()|[\]\\]/.test(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

/** Parseia uma migration: frontmatter JSON entre `---` + corpo markdown. */
export function parseMigration(content: string): Migration {
  const m = content.match(/^\uFEFF?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) {
    throw new Error("Migration sem frontmatter JSON (--- ... ---).");
  }
  let meta: Record<string, unknown>;
  try {
    meta = JSON.parse(m[1]);
  } catch (err) {
    throw new Error(
      `Frontmatter JSON invalido: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (typeof meta.version !== "string") {
    throw new Error('Migration sem campo "version".');
  }
  return {
    version: meta.version,
    previous: typeof meta.previous === "string" ? meta.previous : undefined,
    title: typeof meta.title === "string" ? meta.title : meta.version,
    risk: meta.risk === "high" || meta.risk === "low" ? meta.risk : undefined,
    autoApply: meta.autoApply === true,
    affects: Array.isArray(meta.affects) ? (meta.affects as string[]) : [],
    ops: Array.isArray(meta.ops) ? (meta.ops as MigrationOp[]) : [],
    body: (m[2] ?? "").trim(),
  };
}

/** Le e parseia todas as migrations de um diretorio (arquivos `x.y.z.md`). */
export async function discoverMigrations(dir: string): Promise<Migration[]> {
  if (!(await exists(dir))) return [];
  const out: Migration[] = [];
  for (const name of await readdir(dir)) {
    if (!VERSION_FILE_RE.test(name)) continue;
    out.push(parseMigration(await readFile(join(dir, name), "utf8")));
  }
  return out.sort((a, b) => compareVersions(a.version, b.version));
}

/** Migrations no intervalo (from, to] -- exclusivo no from, inclusivo no to. */
export function migrationsInSpan(
  all: Migration[],
  from: string,
  to: string,
): Migration[] {
  return all
    .filter(
      (mig) =>
        compareVersions(mig.version, from) > 0 &&
        compareVersions(mig.version, to) <= 0,
    )
    .sort((a, b) => compareVersions(a.version, b.version));
}

export interface OpResult {
  op: MigrationOp;
  applied: boolean;
  detail: string;
}

/**
 * Aplica os `ops` mecanicos de uma migration ao projeto (rename/replace).
 * `projectFiles` e a lista atual de arquivos (POSIX, relativos a targetDir),
 * usada para resolver os globs de `replace`.
 */
export async function applyOps(
  targetDir: string,
  ops: MigrationOp[],
  projectFiles: string[],
): Promise<OpResult[]> {
  const results: OpResult[] = [];
  for (const op of ops) {
    if (op.type === "rename" && op.from && op.to) {
      const fromAbs = join(targetDir, ...op.from.split("/"));
      const toAbs = join(targetDir, ...op.to.split("/"));
      if (await exists(fromAbs)) {
        await mkdir(dirname(toAbs), { recursive: true });
        await rename(fromAbs, toAbs);
        results.push({ op, applied: true, detail: `${op.from} -> ${op.to}` });
      } else {
        results.push({ op, applied: false, detail: `${op.from} ausente (no-op)` });
      }
    } else if (op.type === "replace" && op.glob && op.find !== undefined) {
      const matcher = globToRegExp(op.glob);
      const find = new RegExp(op.find, "g");
      let count = 0;
      for (const rel of projectFiles) {
        if (!matcher.test(rel)) continue;
        const abs = join(targetDir, ...rel.split("/"));
        const before = await readFile(abs, "utf8");
        const after = before.replace(find, op.replace ?? "");
        if (after !== before) {
          await writeFile(abs, after, "utf8");
          count++;
        }
      }
      results.push({ op, applied: count > 0, detail: `${op.glob}: ${count} arquivo(s)` });
    } else {
      results.push({ op, applied: false, detail: `op invalida (${op.type})` });
    }
  }
  return results;
}
