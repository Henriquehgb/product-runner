import { cp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
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
function templatesRoot(): string {
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

function applySubstitutions(md: string, opts: ScaffoldOptions): string {
  return md
    .replaceAll("{PROJECT_NAME}", opts.name)
    .replaceAll("{PORT}", opts.port);
}

/** Copia uma árvore de diretórios, pulando arquivos por basename. */
async function copyTree(
  src: string,
  dest: string,
  skip: Set<string>,
  force: boolean,
): Promise<void> {
  await cp(src, dest, {
    recursive: true,
    force,
    filter: (source) => {
      const base = source.split("/").pop() ?? "";
      return !skip.has(base);
    },
  });
}

export interface ScaffoldResult {
  claudeMdPath: string;
  docsPath: string;
}

export async function scaffold(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const root = templatesRoot();
  const commonDir = join(root, "common");
  const profileDir = join(root, `profile-${opts.profile}`);

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

  await mkdir(docsPath, { recursive: true });

  // 1. common/ e profile-X/ → docs/ (sem os fragmentos do CLAUDE.md)
  await copyTree(commonDir, docsPath, CLAUDE_MD_PARTS, opts.force);
  await copyTree(profileDir, docsPath, CLAUDE_MD_PARTS, opts.force);

  // 2. CLAUDE.md = template (common) + extension (perfil), com substituições
  const template = await readFile(
    join(commonDir, "claude-md.template.md"),
    "utf8",
  );
  const extension = await readFile(
    join(profileDir, "claude-md.extension.md"),
    "utf8",
  );

  const merged =
    applySubstitutions(stripTemplateNotice(template).trimEnd(), opts) +
    "\n\n---\n\n" +
    `<!-- Extensão do perfil ${opts.profile}; revise/mescle as seções conforme necessário. -->\n\n` +
    applySubstitutions(stripTemplateNotice(extension).trimStart(), opts) +
    "\n";

  await writeFile(claudeMdPath, merged, "utf8");

  return { claudeMdPath, docsPath };
}
