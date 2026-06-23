import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  scaffold,
  initProject,
  GUIDE_FILENAME,
  MANIFEST_FILENAME,
} from "./scaffold.js";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "cpd-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("scaffold ssr gera docs/ e CLAUDE.md com substituições", async () => {
  await withTempDir(async (dir) => {
    const res = await scaffold({
      name: "meu-app",
      profile: "ssr",
      targetDir: dir,
      port: "4000",
      force: false,
    });

    // docs/ existe e tem arquivos esperados do common e do perfil
    await access(join(dir, "docs", "pipeline.md"));
    await access(join(dir, "docs", "spec-guide.md"));
    await access(join(dir, "docs", "api-patterns.md"));

    // fragmentos do CLAUDE.md NÃO devem ir pra docs/
    await assert.rejects(access(join(dir, "docs", "claude-md.template.md")));
    await assert.rejects(access(join(dir, "docs", "claude-md.extension.md")));

    // CLAUDE.md mesclado e substituído
    const claude = await readFile(res.claudeMdPath, "utf8");
    assert.match(claude, /^# meu-app/m);
    assert.doesNotMatch(claude, /\{PROJECT_NAME\}/);
    assert.match(claude, /4000/); // porta substituída
    assert.match(claude, /Next\.js/); // conteúdo da extension dobrado
  });
});

test("CLAUDE.md dobra a extensão sem meta-cabeçalho nem headings duplicados", async () => {
  await withTempDir(async (dir) => {
    const res = await scaffold({
      name: "app",
      profile: "ssr",
      targetDir: dir,
      port: "3000",
      force: false,
    });
    const claude = await readFile(res.claudeMdPath, "utf8");

    // o fold NÃO deve deixar a seção meta da concatenação antiga
    assert.doesNotMatch(claude, /# Extension CLAUDE\.md/);
    assert.doesNotMatch(claude, /Seções a adicionar\/sobrescrever/);
    assert.doesNotMatch(claude, /### Stack \(extensão\)/);

    // conteúdo da extensão dobrado nas seções-base certas
    assert.match(claude, /## Stack[\s\S]*Next\.js/); // append em Stack
    assert.match(claude, /### Princípio central[\s\S]*API routes são cascas finas/);
    assert.match(claude, /## Comandos úteis[\s\S]*prisma migrate dev/);
    assert.match(claude, /### API Routes \(SSR\)/); // append em Convenções

    // uma única seção Stack (não duplicada)
    assert.equal(claude.match(/^## Stack$/gm)?.length, 1);
  });
});

test("CLAUDE.md traz a rotina de verificação de atualização", async () => {
  await withTempDir(async (dir) => {
    const res = await scaffold({
      name: "app",
      profile: "cli",
      targetDir: dir,
      port: "3000",
      force: false,
    });
    const claude = await readFile(res.claudeMdPath, "utf8");
    assert.match(claude, /## Manutenção dos protocolos de doc/);
    assert.match(claude, /npm view project-docs-blueprints version/);
    assert.match(claude, /update --dry-run/);
    assert.match(claude, /\.pdb-update\/\.last-check/);
  });
});

test("scaffold escreve o manifesto docs/.project-docs-blueprints.json", async () => {
  await withTempDir(async (dir) => {
    const res = await scaffold({
      name: "app-manifesto",
      profile: "ssr",
      targetDir: dir,
      port: "3000",
      force: false,
    });

    assert.equal(res.manifestPath, join(dir, "docs", MANIFEST_FILENAME));
    const manifest = JSON.parse(await readFile(res.manifestPath, "utf8"));

    assert.equal(manifest.manifestVersion, 1);
    assert.equal(manifest.profile, "ssr");
    assert.equal(manifest.projectName, "app-manifesto");
    assert.match(manifest.version, /^\d+\.\d+\.\d+/);

    // entrada do CLAUDE.md + hash bate com o arquivo emitido
    const claudeEntry = manifest.files["CLAUDE.md"];
    assert.ok(claudeEntry, "manifesto deve listar CLAUDE.md");
    assert.match(claudeEntry.fromTemplate, /^merge:/);
    const claude = await readFile(res.claudeMdPath, "utf8");
    assert.equal(
      claudeEntry.sha256,
      "sha256:" + createHash("sha256").update(claude, "utf8").digest("hex"),
    );

    // docs ficheiros listados, fragmentos do CLAUDE.md NÃO
    assert.ok(manifest.files["docs/spec-guide.md"]);
    assert.ok(manifest.files["docs/agents/README.md"]);
    assert.ok(!manifest.files["docs/claude-md.template.md"]);
    assert.ok(!manifest.files["docs/claude-md.extension.md"]);
  });
});

test("scaffold cli funciona sem placeholder de porta", async () => {
  await withTempDir(async (dir) => {
    const res = await scaffold({
      name: "meu-cli",
      profile: "cli",
      targetDir: dir,
      port: "3000",
      force: false,
    });
    const claude = await readFile(res.claudeMdPath, "utf8");
    assert.match(claude, /^# meu-cli/m);
    await access(join(dir, "docs", "code-patterns.md"));
  });
});

test("init coloca o guia START-HERE.md na raiz", async () => {
  await withTempDir(async (dir) => {
    const { guidePath } = await initProject({ targetDir: dir, force: false });
    await access(join(dir, GUIDE_FILENAME));
    const content = await readFile(guidePath, "utf8");
    assert.match(content, /Comece aqui/);
    assert.match(content, /project-docs-blueprints --name/);
  });
});

test("init aborta se o guia já existe sem --force", async () => {
  await withTempDir(async (dir) => {
    await initProject({ targetDir: dir, force: false });
    await assert.rejects(
      initProject({ targetDir: dir, force: false }),
      /Já existe/,
    );
  });
});

test("aborta se docs/ já existe sem --force", async () => {
  await withTempDir(async (dir) => {
    await scaffold({
      name: "x",
      profile: "cli",
      targetDir: dir,
      port: "3000",
      force: false,
    });
    await assert.rejects(
      scaffold({
        name: "x",
        profile: "cli",
        targetDir: dir,
        port: "3000",
        force: false,
      }),
      /Já existe/,
    );
  });
});
