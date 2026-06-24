#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import {
  scaffold,
  initProject,
  ENTRY_AGENT,
  type Profile,
} from "./scaffold.js";
import { update, renderPlan, HANDOFF_DIR } from "./update.js";

const HELP = `product-runner — scaffold de docs para projetos TS com AI

Uso:
  npx product-runner init [--dir <path>] [--force]
  npx product-runner --name <nome> --profile <cli|ssr> [opções]
  npx product-runner update [--dir <path>] [--dry-run] [opções]

Comandos:
  init                 Coloca os agentes de bootstrap (${ENTRY_AGENT} +
                       agente-kickoff.md) na raiz. Peça a uma LLM para ler
                       ${ENTRY_AGENT} e seguir — ele roteia o resto.
  update               Atualiza docs/ + CLAUDE.md de um projeto existente contra
                       a versão atual dos templates (adiciona / auto-merge /
                       revisar). Usa o manifesto se houver; senão, modo legado.
  (sem comando)        Gera docs/ + CLAUDE.md (o scaffold em si).

Opções (scaffold):
  --name <string>      Nome do projeto (obrigatório). Substitui {PROJECT_NAME}.
  --profile <cli|ssr>  Perfil de templates (obrigatório).
  --dir <path>         Diretório alvo. Default: "." (atual).
  --port <number>      Porta default; substitui {PORT}. Default: 3000.
  --force              Sobrescreve arquivos existentes.
  -h, --help           Mostra esta ajuda.

Opções (update):
  --dir <path>          Diretório do projeto. Default: "." (atual).
  --dry-run             Só imprime o plano; não escreve nada.
  --profile <cli|ssr>   Perfil (obrigatório se o projeto não tiver manifesto).
  --normalize-links     Converte links dos arquivos novos pro estilo do projeto.
  --only <glob>         Limita a ação aos paths que casam (ex.: "docs/agents/**").
  --no-format-normalize Não normaliza formatação (Prettier) antes de comparar.

Fluxo recomendado:
  1. npx product-runner init
  2. Peça à sua LLM: "leia ${ENTRY_AGENT} e siga as instruções".

Exemplo (scaffold direto):
  npx product-runner --name meu-app --profile ssr --port 3000 --dir .

Exemplo (update):
  npx product-runner update --dry-run
`;

function fail(msg: string): never {
  console.error(`Erro: ${msg}\n`);
  console.error(HELP);
  process.exit(1);
}

async function runInit(dir: string, force: boolean): Promise<void> {
  const targetDir = resolve(dir);
  try {
    const { files } = await initProject({ targetDir, force });
    console.log(`✔ Agentes de bootstrap criados (${files.length}):`);
    for (const f of files) console.log(`  ${f}`);
    console.log("\nPróximo passo:");
    console.log(`  Abra sua LLM (Claude Code/Cowork) neste diretório e peça:`);
    console.log(`  "leia ${ENTRY_AGENT} e siga as instruções".`);
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

async function runUpdate(values: {
  dir?: string;
  profile?: string;
  "dry-run"?: boolean;
  "normalize-links"?: boolean;
  only?: string;
  "no-format-normalize"?: boolean;
}): Promise<void> {
  if (
    values.profile !== undefined &&
    values.profile !== "cli" &&
    values.profile !== "ssr"
  ) {
    fail(`--profile deve ser "cli" ou "ssr" (recebido: "${values.profile}").`);
  }

  const targetDir = resolve(values.dir ?? ".");
  const dryRun = values["dry-run"] ?? false;

  try {
    const result = await update({
      targetDir,
      profile: values.profile as Profile | undefined,
      dryRun,
      normalizeLinks: values["normalize-links"] ?? false,
      only: values.only,
      formatNormalize: !(values["no-format-normalize"] ?? false),
    });

    const modeNote =
      result.mode === "legacy"
        ? "⚠ Sem manifesto — modo legado (comparação 2-way normalizada).\n"
        : "";
    // Aviso crítico: normalização pedida mas Prettier ausente → REVISAR pode
    // estar inflado só por diferença de formatação.
    const formatNote =
      !(values["no-format-normalize"] ?? false) && !result.prettierFound
        ? "⚠ Prettier não encontrado em node_modules/.bin — comparei SEM normalizar\n" +
          "  formatação. Arquivos podem cair em REVISAR só por estilo (aspas, tabelas).\n" +
          "  Rode `npm install` no projeto e tente de novo, ou use --no-format-normalize\n" +
          "  pra silenciar este aviso.\n"
        : "";
    const header = dryRun
      ? "Plano de update — NADA será escrito.\n"
      : "Update aplicado.\n";
    console.log(modeNote + formatNote + header);
    console.log(renderPlan(result));

    const { add, automerge, review, uptodate } = result.counts;
    const mig = result.migrations.length;
    console.log(
      `\nResumo: ${mig} migration(s) · ${add} adicionar · ${automerge} auto-merge · ${review} revisar · ${uptodate} em dia.`,
    );

    const autoMig = result.migrations.some((m) => m.autoApply && m.ops.length);
    const conductMig = result.migrations.filter((m) => m.body.trim().length > 0).length;

    if (dryRun) {
      if (autoMig) {
        console.log(
          "\nNota: buckets calculados ANTES das migrations; renomeações declaradas\nacima podem reclassificar itens ao aplicar.",
        );
      }
      console.log("\nRode sem --dry-run pra aplicar migrations + ADICIONA + AUTO-MERGE.");
    } else {
      if (conductMig > 0) {
        console.log(
          `\n${conductMig} migration(s) pra conduzir: veja docs/${HANDOFF_DIR}/MIGRATION-*.md.`,
        );
      }
      if (review > 0) {
        console.log(
          `\n${review} arquivo(s) pra revisar: veja os handoffs em docs/${HANDOFF_DIR}/.`,
        );
      }
    }
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
      "dry-run": { type: "boolean", default: false },
      "normalize-links": { type: "boolean", default: false },
      only: { type: "string" },
      "no-format-normalize": { type: "boolean", default: false },
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

  if (command === "update") {
    await runUpdate(values);
    return;
  }

  if (command !== undefined && command !== "scaffold") {
    fail(
      `Comando desconhecido: "${command}". Use "init", "update" ou nenhum comando.`,
    );
  }

  await runScaffold(values);
}

main();
