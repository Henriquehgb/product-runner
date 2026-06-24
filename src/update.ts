import { mkdir, readFile, writeFile, access, rm, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, sep } from "node:path";
import {
  buildArtifacts,
  listFiles,
  sha256,
  writeManifest,
  templatesRoot,
  packageVersion,
  MANIFEST_FILENAME,
  type Artifact,
  type ArtifactMeta,
  type Profile,
} from "./scaffold.js";
import {
  discoverMigrations,
  migrationsInSpan,
  applyOps,
  globToRegExp,
  type Migration,
} from "./migrations.js";

export interface UpdateOptions {
  /** Diretório do projeto a atualizar. */
  targetDir: string;
  /** Perfil; se ausente, lido do manifesto. Obrigatório se não houver manifesto. */
  profile?: Profile;
  /** Só imprime o plano, não escreve nada. */
  dryRun: boolean;
  /** Converte links dos arquivos novos pro estilo do projeto (wiki-links). */
  normalizeLinks: boolean;
  /** Glob simples; limita a ação aos paths que casam. */
  only?: string;
  /** Normalizar formatação (Prettier do projeto) antes de comparar. Default: true. */
  formatNormalize: boolean;
}

export type Bucket = "add" | "automerge" | "uptodate" | "review";

export interface PlanItem {
  /** Caminho como o template emite (docs/...; CLAUDE.md). */
  templatePath: string;
  /** Onde o arquivo está de fato no projeto (difere se foi movido). */
  projectPath: string;
  bucket: Bucket;
  reason: string;
  moved: boolean;
  art: Artifact;
}

export interface UpdateResult {
  mode: "3way" | "legacy";
  plan: PlanItem[];
  applied: boolean;
  handoffDir: string;
  counts: Record<Bucket, number>;
  /** Normalização por Prettier foi pedida (formatNormalize) E disponível? */
  formatActive: boolean;
  /** Prettier local foi encontrado no projeto? */
  prettierFound: boolean;
  /** Migrations no caminho (manifesto.version -> versao do pacote), em ordem. */
  migrations: Migration[];
}

interface Manifest {
  version: string;
  profile: Profile;
  projectName: string;
  port: string;
  files: Record<string, { fromTemplate: string; sha256: string }>;
}

/** Subpasta (dentro de docs/) onde vão os artefatos de handoff dos conflitos. */
export const HANDOFF_DIR = ".prod-runner-update";

/**
 * Nome do manifesto ANTES do rename para `product-runner` (migration 0.5.0).
 * Projetos scaffoldados em versões anteriores têm o manifesto com este nome; o
 * `readManifest` cai pra ele pra ainda achar o cursor — e a migration 0.5.0
 * renomeia o arquivo no disco. Literal de propósito (não derivar do novo nome).
 */
const LEGACY_MANIFEST_FILENAME = ".project-docs-blueprints.json";

/** Diretórios que nunca entram na varredura do projeto. */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".obsidian",
  HANDOFF_DIR,
]);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// --- Normalização (antes de comparar) -------------------------------------
//
// O achado central da recon: sem normalizar, o formatter do projeto faz todo
// arquivo parecer divergente. Normalizamos AMBOS os lados só pra COMPARAR — o
// que vai pro disco é sempre o conteúdo bruto do template.

/** Caminho do Prettier LOCAL do projeto, ou null se não estiver instalado. */
async function prettierBin(projectDir: string): Promise<string | null> {
  const bin = join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prettier.cmd" : "prettier",
  );
  return (await exists(bin)) ? bin : null;
}

/** Roda o Prettier LOCAL do projeto (nunca baixa nada). null se indisponível. */
function runPrettier(
  projectDir: string,
  filename: string,
  content: string,
): Promise<string | null> {
  return new Promise(async (resolve) => {
    const bin = await prettierBin(projectDir);
    if (bin === null) {
      resolve(null);
      return;
    }
    const child = spawn(bin, ["--stdin-filepath", filename], {
      cwd: projectDir,
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", () => {});
    child.on("error", () => resolve(null));
    child.on("close", (code) => resolve(code === 0 ? out : null));
    child.stdin.end(content);
  });
}

/** Reduz links a só o texto visível, pra diferença de estilo não contar. */
function stripLinks(md: string): string {
  return md
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // [[wiki]]
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // [texto](url)
}

async function normalizeForCompare(
  content: string,
  opts: { projectDir: string; filename: string; formatNormalize: boolean },
): Promise<string> {
  let s = content.replace(/\r\n/g, "\n");
  if (opts.formatNormalize) {
    const pretty = await runPrettier(opts.projectDir, opts.filename, s);
    if (pretty !== null) s = pretty;
  }
  s = stripLinks(s);
  s = s
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s + "\n";
}

/** Converte links markdown relativos pro estilo wiki `[[alvo]]` do Obsidian. */
function toWikiLinks(md: string): string {
  return md.replace(/\[([^\]]+)\]\(\.?\/?([^)]+?)(?:\.md)?\)/g, (_m, _text, target) => {
    const base = target.split("/").pop() ?? target;
    return `[[${base}]]`;
  });
}

// --- Detecção de movidos --------------------------------------------------

/** basename ignorando o sufixo `.template` (ex.: _overview.template.md → _overview.md). */
function normBasename(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.template(\.[^.]+)$/, "$1");
}

// --- Classificação --------------------------------------------------------

async function classify(
  art: Artifact,
  templatePath: string,
  projectPath: string | null,
  manifest: Manifest | null,
  opts: UpdateOptions,
): Promise<{ bucket: Bucket; reason: string }> {
  // 1. não existe no projeto → adicionar
  if (projectPath === null) {
    return { bucket: "add", reason: "novo no template; não existe no projeto" };
  }

  const projectRaw = await readFile(join(opts.targetDir, projectPath), "utf8");
  const filename = projectPath.split("/").pop() ?? "x.md";

  // 2. com manifesto: comparar hash bruto contra a base registrada
  const base = manifest?.files[templatePath]?.sha256;
  if (base) {
    const untouched = sha256(projectRaw) === base;
    const templateChanged = sha256(art.content) !== base;
    if (untouched) {
      return templateChanged
        ? { bucket: "automerge", reason: "você não editou; template evoluiu" }
        : { bucket: "uptodate", reason: "em dia (nada mudou)" };
    }
  }

  // 3. iguais após normalizar → no-op (pega diff só de formatação/links)
  const [np, nn] = await Promise.all([
    normalizeForCompare(projectRaw, {
      projectDir: opts.targetDir,
      filename,
      formatNormalize: opts.formatNormalize,
    }),
    normalizeForCompare(art.content, {
      projectDir: opts.targetDir,
      filename,
      formatNormalize: opts.formatNormalize,
    }),
  ]);
  if (np === nn) {
    return { bucket: "uptodate", reason: "idêntico após normalizar formatação" };
  }

  // 4. divergência real → decisão humana (gera handoff)
  return {
    bucket: "review",
    reason: base
      ? "você editou e o template também mudou"
      : "sem manifesto; divergência precisa de classificação",
  };
}

// --- Plano + aplicação ----------------------------------------------------

async function readManifest(targetDir: string): Promise<Manifest | null> {
  // nome atual primeiro; cai pro legado pra ainda achar o cursor de projetos
  // pré-rename (a migration 0.5.0 renomeia o arquivo no disco no mesmo update).
  for (const name of [MANIFEST_FILENAME, LEGACY_MANIFEST_FILENAME]) {
    const p = join(targetDir, "docs", name);
    if (!(await exists(p))) continue;
    try {
      return JSON.parse(await readFile(p, "utf8")) as Manifest;
    } catch {
      return null;
    }
  }
  return null;
}

function handoffContent(item: PlanItem, projectRaw: string): string {
  return `# Handoff de update — ${item.templatePath}

> Gerado pelo \`product-runner update\`. O CLI **não** alterou o arquivo
> original; isto é material pra você (ou uma sessão Claude) classificar e decidir.

- **Arquivo no projeto:** \`${item.projectPath}\`${item.moved ? " (movido em relação ao template)" : ""}
- **Origem no template:** \`${item.art.fromTemplate}\`
- **Motivo:** ${item.reason}

## Tarefa

Classifique cada diferença entre as duas versões abaixo como **melhoria do
template** (trazer) ou **customização do projeto** (preservar), e produza a
versão final mesclada. Em caso de conflito real no mesmo trecho, explique o
tradeoff em vez de escolher sozinho.

## Versão ATUAL (no projeto)

\`\`\`\`\`markdown
${projectRaw.trimEnd()}
\`\`\`\`\`

## Versão NOVA (template)

\`\`\`\`\`markdown
${item.art.content.trimEnd()}
\`\`\`\`\`
`;
}

function migrationHandoff(mig: Migration): string {
  return `# Migration ${mig.version} — ${mig.title}

> Migration **conduzida** (não-automática) do \`product-runner\`. O CLI
> não aplicou nada; conduza as instruções abaixo com o humano.
${mig.previous ? `\n- **De:** ${mig.previous} → **${mig.version}**` : ""}
${mig.risk ? `- **Risco:** ${mig.risk}` : ""}
${mig.affects.length ? `- **Afeta:** ${mig.affects.join(", ")}` : ""}

${mig.body}
`;
}

/**
 * Calcula o plano de update e, se !dryRun, aplica: escreve ADD + AUTO-MERGE
 * (ADD primeiro, pra refs resolverem), gera handoff dos REVIEW sem tocar o
 * original, e reescreve o manifesto com a nova base.
 */
export async function update(opts: UpdateOptions): Promise<UpdateResult> {
  const manifest = await readManifest(opts.targetDir);
  const mode = manifest ? "3way" : "legacy";

  const profile = opts.profile ?? manifest?.profile;
  if (!profile) {
    throw new Error(
      "Sem manifesto e sem --profile. Informe --profile <cli|ssr> pra um projeto legado.",
    );
  }

  // nome/porta: do manifesto, ou inferidos (só afetam o CLAUDE.md, que é review)
  let name = manifest?.projectName;
  let port = manifest?.port ?? "3000";
  if (!name) {
    const claudePath = join(opts.targetDir, "CLAUDE.md");
    if (await exists(claudePath)) {
      const m = (await readFile(claudePath, "utf8")).match(/^#\s+(.+)$/m);
      name = m?.[1]?.trim();
    }
    name = name ?? "projeto";
  }
  const meta: ArtifactMeta = { name, profile, port };

  // Normalização por Prettier só roda se pedida E o binário existir no projeto.
  // Se foi pedida mas não há binário, degradamos — e sinalizamos no resultado
  // (senão arquivos que só diferem por formatação caem em REVISAR sem aviso).
  const prettierFound = (await prettierBin(opts.targetDir)) !== null;
  const formatActive = opts.formatNormalize && prettierFound;
  const effectiveOpts: UpdateOptions = { ...opts, formatNormalize: formatActive };

  const handoffDir = join(opts.targetDir, "docs", HANDOFF_DIR);

  // Migrations: só com manifesto (cursor conhecido). Intervalo
  // (manifesto.version, versão-do-pacote]. Rodam ANTES do diff de estado.
  const pkgVersion = await packageVersion(templatesRoot());
  const migrations = manifest
    ? migrationsInSpan(
        await discoverMigrations(join(templatesRoot(), "migrations")),
        manifest.version,
        pkgVersion,
      )
    : [];

  if (!opts.dryRun && migrations.length) {
    // 1. ops mecânicos das migrations autoApply, em ordem (mutam o projeto)
    for (const mig of migrations) {
      if (mig.autoApply && mig.ops.length) {
        await applyOps(opts.targetDir, mig.ops, await listProjectFiles(opts.targetDir));
      }
    }
    // 2. corpo conduzido → handoff (mesmo em autoApply: parte mecânica roda
    //    sozinha, mas o que precisa de decisão humana fica em MIGRATION-<v>.md)
    const withBody = migrations.filter((m) => m.body.trim().length > 0);
    if (withBody.length) {
      await mkdir(handoffDir, { recursive: true });
      for (const mig of withBody) {
        await writeFile(
          join(handoffDir, `MIGRATION-${mig.version}.md`),
          migrationHandoff(mig),
          "utf8",
        );
      }
    }
  }

  const artifacts = await buildArtifacts(meta);

  // índice de arquivos do projeto por basename normalizado (pra detectar movidos)
  // (já reflete o resultado das migrations autoApply, aplicadas acima)
  const projectFiles = await listProjectFiles(opts.targetDir);
  const byBasename = new Map<string, string[]>();
  for (const p of projectFiles) {
    const key = normBasename(p);
    const list = byBasename.get(key) ?? [];
    list.push(p);
    byBasename.set(key, list);
  }

  const onlyRe = opts.only ? globToRegExp(opts.only) : null;
  const templatePaths = new Set(artifacts.keys());

  const plan: PlanItem[] = [];
  for (const [templatePath, art] of artifacts) {
    // resolve onde (e se) o arquivo existe no projeto
    let projectPath: string | null = null;
    let moved = false;
    if (await exists(join(opts.targetDir, templatePath))) {
      projectPath = templatePath;
    } else {
      // candidatos a "movido": mesmo basename, mas NÃO um arquivo que já é
      // emitido pelo template no próprio lugar dele (evita casar docs/README.md
      // com docs/agents/README.md, p.ex.).
      const candidates = (byBasename.get(normBasename(templatePath)) ?? []).filter(
        (p) => !templatePaths.has(p),
      );
      if (candidates.length === 1) {
        projectPath = candidates[0];
        moved = projectPath !== templatePath;
      }
    }

    if (onlyRe && !onlyRe.test(templatePath) && !(projectPath && onlyRe.test(projectPath))) {
      continue;
    }

    const { bucket, reason } = await classify(
      art,
      templatePath,
      projectPath,
      manifest,
      effectiveOpts,
    );
    plan.push({
      templatePath,
      projectPath: projectPath ?? templatePath,
      bucket,
      reason,
      moved,
      art,
    });
  }

  const counts: Record<Bucket, number> = {
    add: 0,
    automerge: 0,
    uptodate: 0,
    review: 0,
  };
  for (const it of plan) counts[it.bucket]++;

  if (!opts.dryRun) {
    const projectUsesWiki = await detectWikiLinks(opts.targetDir, projectFiles);

    // ADD primeiro (pra refs de arquivos novos resolverem nos merges)
    for (const it of plan.filter((i) => i.bucket === "add")) {
      let content = it.art.content;
      if (opts.normalizeLinks && projectUsesWiki) content = toWikiLinks(content);
      const dest = join(opts.targetDir, ...it.templatePath.split("/"));
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, content, "utf8");
    }
    // AUTO-MERGE: substitui no lugar atual (inclusive se movido)
    for (const it of plan.filter((i) => i.bucket === "automerge")) {
      let content = it.art.content;
      if (opts.normalizeLinks && projectUsesWiki) content = toWikiLinks(content);
      const dest = join(opts.targetDir, ...it.projectPath.split("/"));
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, content, "utf8");
    }
    // REVIEW: gera handoff, nunca toca o original
    const reviews = plan.filter((i) => i.bucket === "review");
    if (reviews.length) {
      await mkdir(handoffDir, { recursive: true });
      // limpa só handoffs antigos; preserva o resto (ex.: marcador .last-check)
      for (const f of await readdir(handoffDir)) {
        if (f.endsWith(".handoff.md")) {
          await rm(join(handoffDir, f), { force: true });
        }
      }
      for (const it of reviews) {
        const projectRaw = await readFile(
          join(opts.targetDir, it.projectPath),
          "utf8",
        );
        const flat = it.templatePath.replace(/\//g, "__");
        await writeFile(
          join(handoffDir, `${flat}.handoff.md`),
          handoffContent(it, projectRaw),
          "utf8",
        );
      }
    }

    // reescreve o manifesto: base passa a ser o template atual (vira 3-way no próximo)
    await writeManifest(join(opts.targetDir, "docs"), meta, artifacts);
  }

  return {
    mode,
    plan,
    applied: !opts.dryRun,
    handoffDir,
    counts,
    formatActive,
    prettierFound,
    migrations,
  };
}

/** Lista arquivos do projeto (POSIX, relativos a targetDir), pulando SKIP_DIRS. */
async function listProjectFiles(targetDir: string): Promise<string[]> {
  const all = await listFiles(targetDir);
  return all.filter((p) => !p.split("/").some((seg) => SKIP_DIRS.has(seg)));
}

/** Heurística: o projeto usa predominantemente wiki-links `[[x]]`? */
async function detectWikiLinks(
  targetDir: string,
  projectFiles: string[],
): Promise<boolean> {
  let wiki = 0;
  for (const p of projectFiles.filter((f) => f.endsWith(".md")).slice(0, 50)) {
    const content = await readFile(join(targetDir, p), "utf8");
    wiki += (content.match(/\[\[[^\]]+\]\]/g) ?? []).length;
  }
  return wiki >= 3;
}

const BUCKET_LABEL: Record<Bucket, string> = {
  add: "➕ ADICIONA",
  automerge: "✅ AUTO-MERGE",
  uptodate: "✓ EM DIA",
  review: "⚠️  REVISAR",
};

/** Renderiza o plano pra impressão no terminal. */
export function renderPlan(result: UpdateResult): string {
  const lines: string[] = [];

  if (result.migrations.length) {
    lines.push(`🧭 MIGRATIONS no caminho (${result.migrations.length}) — em ordem, antes do diff:`);
    for (const mig of result.migrations) {
      const mode = mig.autoApply ? "automático" : "conduzir";
      const risk = mig.risk ? ` · risco ${mig.risk}` : "";
      lines.push(`   ${mig.version}  ${mig.title}  [${mode}${risk}]`);
    }
    lines.push("");
  }

  const order: Bucket[] = ["add", "automerge", "review", "uptodate"];
  for (const bucket of order) {
    const items = result.plan.filter((i) => i.bucket === bucket);
    if (!items.length) continue;
    lines.push(`${BUCKET_LABEL[bucket]} (${items.length})`);
    for (const it of items) {
      const path = it.moved ? `${it.projectPath} ← ${it.templatePath}` : it.templatePath;
      lines.push(`   ${path}  — ${it.reason}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
