import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold } from "./scaffold.js";

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
    assert.match(claude, /Perfil SSR/); // veio da extension
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
