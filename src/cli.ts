#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { scaffold, type Profile } from "./scaffold.js";

const HELP = `create-project-docs — scaffold de docs para projetos TS com AI

Uso:
  npx create-project-docs --name <nome> --profile <cli|ssr> [opções]

Opções:
  --name <string>      Nome do projeto (obrigatório). Substitui {PROJECT_NAME}.
  --profile <cli|ssr>  Perfil de templates (obrigatório).
  --dir <path>         Diretório alvo. Default: "." (atual).
  --port <number>      Porta default; substitui {PORT}. Default: 3000.
  --force              Sobrescreve docs/ e CLAUDE.md existentes.
  -h, --help           Mostra esta ajuda.

Gera no diretório alvo:
  docs/        common/ + profile-<perfil>/ (sem os fragmentos do CLAUDE.md)
  CLAUDE.md    merge do template-base + extension do perfil, já substituído

Exemplo:
  npx create-project-docs --name meu-app --profile ssr --port 3000 --dir .
`;

function fail(msg: string): never {
  console.error(`Erro: ${msg}\n`);
  console.error(HELP);
  process.exit(1);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: "string" },
      profile: { type: "string" },
      dir: { type: "string", default: "." },
      port: { type: "string", default: "3000" },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

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

main();
