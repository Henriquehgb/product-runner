#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import {
  scaffold,
  initProject,
  GUIDE_FILENAME,
  type Profile,
} from "./scaffold.js";

const HELP = `project-docs-blueprints — scaffold de docs para projetos TS com AI

Uso:
  npx project-docs-blueprints init [--dir <path>] [--force]
  npx project-docs-blueprints --name <nome> --profile <cli|ssr> [opções]

Comandos:
  init                 Coloca o guia ${GUIDE_FILENAME} na raiz. Peça a uma LLM
                       para ler esse arquivo e seguir — ela roda o resto.
  (sem comando)        Gera docs/ + CLAUDE.md (o scaffold em si).

Opções (scaffold):
  --name <string>      Nome do projeto (obrigatório). Substitui {PROJECT_NAME}.
  --profile <cli|ssr>  Perfil de templates (obrigatório).
  --dir <path>         Diretório alvo. Default: "." (atual).
  --port <number>      Porta default; substitui {PORT}. Default: 3000.
  --force              Sobrescreve arquivos existentes.
  -h, --help           Mostra esta ajuda.

Fluxo recomendado:
  1. npx project-docs-blueprints init
  2. Peça à sua LLM: "leia ${GUIDE_FILENAME} e siga as instruções".

Exemplo (scaffold direto):
  npx project-docs-blueprints --name meu-app --profile ssr --port 3000 --dir .
`;

function fail(msg: string): never {
  console.error(`Erro: ${msg}\n`);
  console.error(HELP);
  process.exit(1);
}

async function runInit(dir: string, force: boolean): Promise<void> {
  const targetDir = resolve(dir);
  try {
    const { guidePath } = await initProject({ targetDir, force });
    console.log(`✔ Guia criado em: ${guidePath}`);
    console.log("\nPróximo passo:");
    console.log(
      `  Abra sua LLM (Claude Code/Cowork) neste diretório e peça:`,
    );
    console.log(`  "leia ${GUIDE_FILENAME} e siga as instruções".`);
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

async function runScaffold(
  values: {
    name?: string;
    profile?: string;
    dir?: string;
    port?: string;
    force?: boolean;
  },
): Promise<void> {
  if (!values.name) fail("--name é obrigatório.");
  if (!values.profile) fail("--profile é obrigatório.");
  if (values.profile !== "cli" && values.profile !== "ssr") {
    fail(`--profile deve ser "cli" ou "ssr" (recebido: "${values.profile}").`);
  }

  const targetDir = resolve(values.dir ?? ".");

  try {
    const result = await scaffold({
      name: values.name,
      profile: values.profile as Profile,
      targetDir,
      port: values.port ?? "3000",
      force: values.force ?? false,
    });

    console.log(`✔ docs criados em: ${result.docsPath}`);
    console.log(`✔ CLAUDE.md criado em: ${result.claudeMdPath}`);
    console.log("\nPróximos passos:");
    console.log("  1. Revise o CLAUDE.md e preencha placeholders restantes ({...}).");
    console.log("  2. git init (se ainda não for um repo).");
    console.log("  3. Escreva a primeira spec em specs/setup/00-*.md (ver docs/spec-guide.md).");
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      name: { type: "string" },
      profile: { type: "string" },
      dir: { type: "string", default: "." },
      port: { type: "string", default: "3000" },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

  const command = positionals[0];

  if (command === "init") {
    await runInit(values.dir ?? ".", values.force ?? false);
    return;
  }

  if (command !== undefined && command !== "scaffold") {
    fail(`Comando desconhecido: "${command}". Use "init" ou nenhum comando.`);
  }

  await runScaffold(values);
}

main();
