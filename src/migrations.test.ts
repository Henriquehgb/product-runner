import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseMigration,
  compareVersions,
  migrationsInSpan,
  applyOps,
  discoverMigrations,
  type Migration,
} from "./migrations.js";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "prod-runner-mig-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("compareVersions ordena semver simples", () => {
  assert.ok(compareVersions("0.2.0", "0.2.1") < 0);
  assert.ok(compareVersions("0.3.0", "0.2.9") > 0);
  assert.equal(compareVersions("1.2.3", "1.2.3"), 0);
  assert.ok(compareVersions("0.10.0", "0.9.0") > 0); // numérico, não lexical
});

test("parseMigration lê frontmatter JSON + corpo", () => {
  const content = `---
{ "version": "0.3.0", "previous": "0.2.3", "title": "T", "risk": "high",
  "autoApply": false, "affects": ["docs/x.md"], "ops": [] }
---

## O que mudou

corpo aqui.`;
  const m = parseMigration(content);
  assert.equal(m.version, "0.3.0");
  assert.equal(m.previous, "0.2.3");
  assert.equal(m.risk, "high");
  assert.equal(m.autoApply, false);
  assert.deepEqual(m.affects, ["docs/x.md"]);
  assert.match(m.body, /corpo aqui/);
});

test("parseMigration rejeita arquivo sem frontmatter", () => {
  assert.throws(() => parseMigration("# só markdown\n"), /frontmatter/);
});

test("migrationsInSpan filtra (from, to] em ordem", () => {
  const mk = (v: string): Migration => ({
    version: v,
    title: v,
    autoApply: false,
    affects: [],
    ops: [],
    body: "",
  });
  const all = [mk("0.4.0"), mk("0.2.5"), mk("0.3.0"), mk("0.5.0")];
  const span = migrationsInSpan(all, "0.2.5", "0.4.0");
  assert.deepEqual(
    span.map((m) => m.version),
    ["0.3.0", "0.4.0"], // exclui 0.2.5 (from), inclui 0.4.0 (to), exclui 0.5.0
  );
});

test("applyOps: rename move o arquivo; ausente é no-op", async () => {
  await withTempDir(async (dir) => {
    await mkdir(join(dir, "docs"), { recursive: true });
    await writeFile(join(dir, "docs", "a.md"), "conteúdo");
    const res = await applyOps(
      dir,
      [
        { type: "rename", from: "docs/a.md", to: "docs/b.md" },
        { type: "rename", from: "docs/nao-existe.md", to: "docs/c.md" },
      ],
      ["docs/a.md"],
    );
    await access(join(dir, "docs", "b.md")); // movido
    await assert.rejects(access(join(dir, "docs", "a.md"))); // origem sumiu
    assert.equal(res[0].applied, true);
    assert.equal(res[1].applied, false); // no-op
  });
});

test("applyOps: replace aplica regex nos arquivos do glob", async () => {
  await withTempDir(async (dir) => {
    await mkdir(join(dir, "docs"), { recursive: true });
    await writeFile(join(dir, "docs", "x.md"), "link [[_overview.template]] aqui");
    await applyOps(
      dir,
      [
        {
          type: "replace",
          glob: "docs/**/*.md",
          find: "_overview\\.template",
          replace: "_overview",
        },
      ],
      ["docs/x.md"],
    );
    const after = await readFile(join(dir, "docs", "x.md"), "utf8");
    assert.match(after, /\[\[_overview\]\]/);
    assert.doesNotMatch(after, /_overview\.template/);
  });
});

test("discoverMigrations lê só arquivos x.y.z.md, em ordem (ignora README)", async () => {
  await withTempDir(async (dir) => {
    const fm = (v: string) =>
      `---\n{ "version": "${v}", "title": "${v}", "autoApply": true, "ops": [] }\n---\ncorpo`;
    await writeFile(join(dir, "0.4.0.md"), fm("0.4.0"));
    await writeFile(join(dir, "0.3.0.md"), fm("0.3.0"));
    await writeFile(join(dir, "README.md"), "# não é migration");
    const found = await discoverMigrations(dir);
    assert.deepEqual(
      found.map((m) => m.version),
      ["0.3.0", "0.4.0"],
    );
  });
});

test("discoverMigrations em diretório inexistente retorna []", async () => {
  await withTempDir(async (dir) => {
    const found = await discoverMigrations(join(dir, "nao-existe"));
    assert.deepEqual(found, []);
  });
});
