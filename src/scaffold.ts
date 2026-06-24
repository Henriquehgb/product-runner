import { mkdir, readFile, writeFile, access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export type Profile = "cli" | "ssr";

export interface ScaffoldOptions {
  /** Nome do projeto — substitui {PROJECT_NAME} no CLAUDE.md. */
  name: string;
  /** Perfil de templates a aplicar. */
  profile: Profile;
  /** Diretório alvo onde docs/ e CLAUDE.md serão criados. */
  targetDir: string;
  /** Porta default do projeto (perfil ssr) — substitui {PORT}. */
  port: string;
  /** Sobrescreve arquivos existentes em vez de abortar. */
  force: boolean;
}

/** Raiz do pacote (um nível acima de dist/ ou src/), onde vivem os templates. */
export function templatesRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..");
}

/** Arquivos de template que NÃO vão pra docs/ — são mesclados no CLAUDE.md. */
const CLAUDE_MD_PARTS = new Set([
  "claude-md.template.md",
  "claude-md.extension.md",
]);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove o blockquote de aviso "este é um template / extensão" do topo de um
 * fragmento de CLAUDE.md — instrução de uso que não faz sentido no arquivo final.
 */
function stripTemplateNotice(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const isNoticeStart =
      line.startsWith(">") && /\btemplate\b|\bextens[ãa]o\b/i.test(line);
    if (isNoticeStart) {
      // pula o bloco de citação inteiro (linhas começando com ">")
      while (i < lines.length && lines[i].startsWith(">")) i++;
      // pula uma linha em branco logo após o bloco, se houver
      if (i < lines.length && lines[i].trim() === "") i++;
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join("\n");
}

function applySubstitutions(
  md: string,
  sub: { name: string; port: string },
): string {
  return md.replaceAll("{PROJECT_NAME}", sub.name).replaceAll("{PORT}", sub.port);
}

// --- Merge do CLAUDE.md por diretivas (base + extensão do perfil) ---------
//
// A extensão do perfil não é concatenada: ela declara, via diretivas, como cada
// trecho dobra nas seções do template-base. Sintaxe de uma diretiva (linha):
//
//   <!-- pdb-merge: <modo> section="<texto do heading>" -->
//
// Modos:
//   replace  troca a seção-alvo inteira (heading + corpo) pelo conteúdo do bloco.
//   append   acrescenta o conteúdo do bloco ao fim do corpo da seção-alvo.
//   after    insere o conteúdo do bloco logo após a seção-alvo (nova seção).
//
// O conteúdo de um bloco vai da diretiva até a próxima diretiva (ou o fim).
// Linhas antes da primeira diretiva são ignoradas (cabeçalho explicativo).

type MergeMode = "replace" | "append" | "after";

interface MergeDirective {
  mode: MergeMode;
  section: string;
  content: string;
}

const DIRECTIVE_RE =
  /^<!--\s*pdb-merge:\s*(replace|append|after)\s+section="([^"]+)"\s*-->\s*$/;

function parseDirectives(extension: string): MergeDirective[] {
  const directives: MergeDirective[] = [];
  let current: MergeDirective | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (current) {
      current.content = buf.join("\n").replace(/^\n+|\n+$/g, "");
      directives.push(current);
    }
  };

  for (const line of extension.split("\n")) {
    const m = line.match(DIRECTIVE_RE);
    if (m) {
      flush();
      current = { mode: m[1] as MergeMode, section: m[2], content: "" };
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return directives;
}

/** Nível (1-6) de um heading ATX, ou null se a linha não for heading. */
function headingLevel(line: string): number | null {
  const m = line.match(/^(#{1,6})\s+/);
  return m ? m[1].length : null;
}

/**
 * Localiza uma seção pelo texto do heading. Retorna [start, end) em índices de
 * linha; `end` é a próxima heading de nível menor-ou-igual (ou o fim do doc).
 */
function findSection(
  lines: string[],
  heading: string,
): { start: number; end: number } {
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const lvl = headingLevel(lines[i]);
    if (lvl !== null && lines[i].replace(/^#{1,6}\s+/, "").trim() === heading) {
      start = i;
      level = lvl;
      break;
    }
  }
  if (start === -1) {
    throw new Error(
      `Diretiva pdb-merge: seção "${heading}" não existe no CLAUDE.md base.`,
    );
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const lvl = headingLevel(lines[i]);
    if (lvl !== null && lvl <= level) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function applyDirective(lines: string[], d: MergeDirective): string[] {
  const { start, end } = findSection(lines, d.section);
  const before = lines.slice(0, start);
  const section = lines.slice(start, end);
  const after = lines.slice(end);
  const content = d.content.split("\n");

  if (d.mode === "replace") {
    return [...before, ...content, "", ...after];
  }
  if (d.mode === "after") {
    return [...before, ...section, ...content, "", ...after];
  }
  // append: corpo da seção, sem linhas em branco finais, + conteúdo novo
  const body = [...section];
  while (body.length && body[body.length - 1].trim() === "") body.pop();
  return [...before, ...body, "", ...content, "", ...after];
}

/** Dobra a extensão do perfil no template-base via diretivas pdb-merge. */
function mergeClaudeMd(base: string, extension: string): string {
  let lines = base.split("\n");
  for (const directive of parseDirectives(extension)) {
    lines = applyDirective(lines, directive);
  }
  // colapsa 3+ linhas em branco seguidas em no máximo 1 (resultado limpo)
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export interface ScaffoldResult {
  claudeMdPath: string;
  docsPath: string;
  manifestPath: string;
}

/** Nome do manifesto escrito em docs/ — base para futuros `update`. */
export const MANIFEST_FILENAME = ".project-docs-blueprints.json";

export function sha256(content: string): string {
  return "sha256:" + createHash("sha256").update(content, "utf8").digest("hex");
}

/** Lista recursiva de arquivos (caminhos relativos POSIX) sob `dir`. */
export async function listFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full, base)));
    } else {
      out.push(relative(base, full).split(sep).join("/"));
    }
  }
  return out;
}

/** Versão do pacote (do package.json na raiz do pacote). */
export async function packageVersion(root: string): Promise<string> {
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  return typeof pkg.version === "string" ? pkg.version : "0.0.0";
}

/** Um arquivo que o scaffold emitiria: conteúdo final + origem no pacote. */
export interface Artifact {
  /** Conteúdo EXATO que iria pro disco (pós-merge/substituição). */
  content: string;
  /** Origem no pacote (path relativo, ou `merge:...` no caso do CLAUDE.md). */
  fromTemplate: string;
}

/** Dados mínimos pra materializar os artefatos de um perfil. */
export interface ArtifactMeta {
  name: string;
  profile: Profile;
  port: string;
}

/**
 * Calcula (SEM escrever) todos os arquivos que o scaffold emitiria, como um
 * mapa destPath(relativo ao targetDir, POSIX) → Artifact. É a fonte única usada
 * tanto pelo `scaffold` (escreve) quanto pelo `update` (compara). Garante que a
 * "base" registrada no manifesto seja byte-idêntica ao que seria gerado.
 */
export async function buildArtifacts(
  meta: ArtifactMeta,
): Promise<Map<string, Artifact>> {
  const root = templatesRoot();
  const commonDir = join(root, "common");
  const profileDir = join(root, `profile-${meta.profile}`);
  const out = new Map<string, Artifact>();

  // docs/* (common + perfil), exceto os fragmentos do CLAUDE.md
  for (const [srcDir, prefix] of [
    [commonDir, "common"],
    [profileDir, `profile-${meta.profile}`],
  ] as const) {
    for (const rel of await listFiles(srcDir)) {
      const base = rel.split("/").pop() ?? "";
      if (CLAUDE_MD_PARTS.has(base)) continue;
      // docs são copiados sem substituição → conteúdo emitido == origem
      const content = await readFile(join(srcDir, rel), "utf8");
      out.set(`docs/${rel}`, { content, fromTemplate: `${prefix}/${rel}` });
    }
  }

  // CLAUDE.md = base com a extensão do perfil dobrada via diretivas
  const template = await readFile(
    join(commonDir, "claude-md.template.md"),
    "utf8",
  );
  const extension = await readFile(
    join(profileDir, "claude-md.extension.md"),
    "utf8",
  );
  const merged =
    applySubstitutions(
      mergeClaudeMd(stripTemplateNotice(template), extension),
      meta,
    ).trimEnd() + "\n";
  out.set("CLAUDE.md", {
    content: merged,
    fromTemplate: `merge:common/claude-md.template.md+profile-${meta.profile}/claude-md.extension.md`,
  });

  return out;
}

/**
 * Escreve o manifesto em docs/ a partir dos artefatos emitidos. O hash de cada
 * arquivo é do conteúdo EMITIDO — vira a "base" que torna o `update` 3-way.
 */
export async function writeManifest(
  docsPath: string,
  meta: ArtifactMeta,
  artifacts: Map<string, Artifact>,
): Promise<string> {
  const files: Record<string, { fromTemplate: string; sha256: string }> = {};
  for (const [path, art] of artifacts) {
    files[path] = { fromTemplate: art.fromTemplate, sha256: sha256(art.content) };
  }
  const manifest = {
    manifestVersion: 1,
    package: "project-docs-blueprints",
    version: await packageVersion(templatesRoot()),
    profile: meta.profile,
    projectName: meta.name,
    port: meta.port,
    files: Object.fromEntries(
      Object.keys(files)
        .sort()
        .map((k) => [k, files[k]]),
    ),
  };
  const manifestPath = join(docsPath, MANIFEST_FILENAME);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return manifestPath;
}

export async function scaffold(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const docsPath = join(opts.targetDir, "docs");
  const claudeMdPath = join(opts.targetDir, "CLAUDE.md");

  if (!opts.force) {
    for (const p of [docsPath, claudeMdPath]) {
      if (await exists(p)) {
        throw new Error(
          `Já existe "${p}". Use --force para sobrescrever ou escolha outro --dir.`,
        );
      }
    }
  }

  const artifacts = await buildArtifacts(opts);

  // escreve cada artefato no destino (docs/* e CLAUDE.md na raiz)
  for (const [rel, art] of artifacts) {
    const dest = join(opts.targetDir, ...rel.split("/"));
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, art.content, "utf8");
  }

  const manifestPath = await writeManifest(docsPath, opts, artifacts);

  return { claudeMdPath, docsPath, manifestPath };
}

export interface InitOptions {
  /** Diretório alvo onde o arquivo-guia será criado. */
  targetDir: string;
  /** Sobrescreve o guia se já existir. */
  force: boolean;
}

export interface InitResult {
  guidePath: string;
}

/** Nome do arquivo-guia colocado na raiz pelo comando `init`. */
export const GUIDE_FILENAME = "START-HERE.md";

/**
 * Copia o arquivo-guia (assets/START-HERE.md) para a raiz do projeto. É o
 * ponto de entrada: a partir dele uma LLM lê e roda o scaffold.
 */
export async function initProject(opts: InitOptions): Promise<InitResult> {
  const root = templatesRoot();
  const src = join(root, "assets", GUIDE_FILENAME);
  const guidePath = join(opts.targetDir, GUIDE_FILENAME);

  if (!opts.force && (await exists(guidePath))) {
    throw new Error(
      `Já existe "${guidePath}". Use --force para sobrescrever.`,
    );
  }

  await mkdir(opts.targetDir, { recursive: true });
  const content = await readFile(src, "utf8");
  await writeFile(guidePath, content, "utf8");

  return { guidePath };
}
