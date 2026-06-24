import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold, sha256, MANIFEST_FILENAME } from "./scaffold.js";
import { update, HANDOFF_DIR } from "./update.js";

async function withProject(
  fn: (dir: string) => Promise<void>,
  profile: "cli" | "ssr" = "ssr",
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "pdb-up-"));
  try {
    await scaffold({ name: "proj", profile, targetDir: dir, port: "3000", force: false });
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const manifestPath = (dir: string) => join(dir, "docs", MANIFEST_FILENAME);
async function readManifest(dir: string) {
  return JSON.parse(await readFile(manifestPath(dir), "utf8"));
}

test("projeto recém-scaffoldado: tudo em dia, nada a fazer", async () => {
  await withProject(async (dir) => {
    const res = await update({
      targetDir: dir,
      dryRun: true,
      normalizeLinks: false,
      formatNormalize: true,
    });
    assert.equal(res.mode, "3way");
    assert.equal(res.counts.add, 0);
    assert.equal(res.counts.automerge, 0);
    assert.equal(res.counts.review, 0);
    assert.ok(res.counts.uptodate > 0);
    assert.deepEqual(res.migrations, []); // pacote não envia migrations ainda
  });
});

test("arquivo faltante é classificado como ADD e re-adicionado ao aplicar", async () => {
  await withProject(async (dir) => {
    await rm(join(dir, "docs", "pipeline.md"));
    const plan = await update({
      targetDir: dir,
      dryRun: false,
      normalizeLinks: false,
      formatNormalize: true,
    });
    const item = plan.plan.find((i) => i.templatePath === "docs/pipeline.md");
    assert.equal(item?.bucket, "add");
    await access(join(dir, "docs", "pipeline.md")); // re-adicionado
  });
});

test("arquivo editado vai pra REVIEW, é preservado e gera handoff", async () => {
  await withProject(async (dir) => {
    const p = join(dir, "docs", "design-principles.md");
    const original = await readFile(p, "utf8");
    await writeFile(p, original + "\n## Customização do projeto\n\nminha edição\n");

    const res = await update({
      targetDir: dir,
      dryRun: false,
      normalizeLinks: false,
      formatNormalize: true,
    });
    const item = res.plan.find((i) => i.templatePath === "docs/design-principles.md");
    assert.equal(item?.bucket, "review");

    // original preservado (não foi sobrescrito)
    const after = await readFile(p, "utf8");
    assert.match(after, /minha edição/);

    // handoff gerado, com as duas versões
    const handoff = await readFile(
      join(dir, "docs", HANDOFF_DIR, "docs__design-principles.md.handoff.md"),
      "utf8",
    );
    assert.match(handoff, /Versão ATUAL/);
    assert.match(handoff, /Versão NOVA/);
    assert.match(handoff, /minha edição/);
  });
});

test("AUTO-MERGE: arquivo intocado pelo usuário mas com template novo", async () => {
  await withProject(async (dir) => {
    const rel = "docs/design-principles.md";
    const p = join(dir, rel);

    // simula que o arquivo veio de um template ANTIGO: corpo "velho" no projeto
    // e base do manifesto = hash desse corpo velho (usuário não editou desde então).
    const oldBody = "# Design Principles (versão antiga)\n\nconteúdo velho\n";
    await writeFile(p, oldBody);
    const manifest = await readManifest(dir);
    manifest.files[rel].sha256 = sha256(oldBody);
    await writeFile(manifestPath(dir), JSON.stringify(manifest, null, 2) + "\n");

    const res = await update({
      targetDir: dir,
      dryRun: false,
      normalizeLinks: false,
      formatNormalize: true,
    });
    const item = res.plan.find((i) => i.templatePath === rel);
    assert.equal(item?.bucket, "automerge");

    // ao aplicar, o arquivo passa a ser a versão nova do template
    const after = await readFile(p, "utf8");
    assert.doesNotMatch(after, /conteúdo velho/);
  });
});

test("não confunde basename ambíguo com movido (docs/README vs agents/README)", async () => {
  await withProject(async (dir) => {
    // docs/README.md e docs/agents/README.md compartilham basename; remover o
    // primeiro NÃO pode fazê-lo casar com o segundo — deve ser ADD.
    await rm(join(dir, "docs", "README.md"));
    const res = await update({
      targetDir: dir,
      dryRun: true,
      normalizeLinks: false,
      formatNormalize: true,
    });
    const item = res.plan.find((i) => i.templatePath === "docs/README.md");
    assert.equal(item?.bucket, "add");
    assert.equal(item?.moved, false);
  });
});

test("modo legado: sem manifesto exige --profile e re-adiciona faltantes", async () => {
  await withProject(async (dir) => {
    await rm(manifestPath(dir));

    // sem profile → erro
    await assert.rejects(
      update({
        targetDir: dir,
        dryRun: true,
        normalizeLinks: false,
        formatNormalize: true,
      }),
      /profile/,
    );

    // com profile → modo legado funciona
    await rm(join(dir, "docs", "pipeline.md"));
    const res = await update({
      targetDir: dir,
      profile: "ssr",
      dryRun: true,
      normalizeLinks: false,
      formatNormalize: true,
    });
    assert.equal(res.mode, "legacy");
    const item = res.plan.find((i) => i.templatePath === "docs/pipeline.md");
    assert.equal(item?.bucket, "add");
  });
});

test("sinaliza quando Prettier não está disponível (normalização degradada)", async () => {
  await withProject(async (dir) => {
    // projeto de teste não tem node_modules/.bin/prettier
    const res = await update({
      targetDir: dir,
      dryRun: true,
      normalizeLinks: false,
      formatNormalize: true,
    });
    assert.equal(res.prettierFound, false);
    assert.equal(res.formatActive, false);
  });
});

test("gerar handoffs preserva o marcador .last-check", async () => {
  await withProject(async (dir) => {
    // marcador de data pré-existente na pasta de trabalho
    await mkdir(join(dir, "docs", HANDOFF_DIR), { recursive: true });
    await writeFile(join(dir, "docs", HANDOFF_DIR, ".last-check"), "2026-06-23");

    // força um REVIEW (edita um doc) e aplica
    const p = join(dir, "docs", "design-principles.md");
    await writeFile(p, (await readFile(p, "utf8")) + "\nedição\n");
    await update({
      targetDir: dir,
      dryRun: false,
      normalizeLinks: false,
      formatNormalize: true,
    });

    // handoff foi gerado E o marcador sobreviveu
    await access(join(dir, "docs", HANDOFF_DIR, "docs__design-principles.md.handoff.md"));
    const mark = await readFile(join(dir, "docs", HANDOFF_DIR, ".last-check"), "utf8");
    assert.equal(mark, "2026-06-23");
  });
});

test("migration 0.3.0: renomeia _overview.template -> specs/ e gera handoff conduzido", async () => {
  await withProject(async (dir) => {
    // simula layout antigo: cursor 0.2.3 + docs/_overview.template.md, sem specs/
    await rm(join(dir, "specs", "_overview.md"));
    const manifest = await readManifest(dir);
    manifest.version = "0.2.3";
    await writeFile(manifestPath(dir), JSON.stringify(manifest, null, 2) + "\n");
    await writeFile(join(dir, "docs", "_overview.template.md"), "roadmap do projeto");

    const res = await update({
      targetDir: dir,
      dryRun: false,
      normalizeLinks: false,
      formatNormalize: false,
    });

    // a migration 0.3.0 está no caminho (0.2.3 -> 0.3.0)
    assert.ok(res.migrations.some((m) => m.version === "0.3.0"));
    // rename aplicado, conteúdo preservado, origem removida
    await access(join(dir, "specs", "_overview.md"));
    await assert.rejects(access(join(dir, "docs", "_overview.template.md")));
    assert.match(
      await readFile(join(dir, "specs", "_overview.md"), "utf8"),
      /roadmap do projeto/,
    );
    // handoff conduzido (parte não-mecânica: CLAUDE.md -> agente-pdb)
    await access(join(dir, "docs", HANDOFF_DIR, "MIGRATION-0.3.0.md"));
  });
});

test("aplicar reescreve o manifesto (próximo update já é 3-way)", async () => {
  await withProject(async (dir) => {
    await rm(manifestPath(dir));
    await update({
      targetDir: dir,
      profile: "ssr",
      dryRun: false,
      normalizeLinks: false,
      formatNormalize: true,
    });
    await access(manifestPath(dir)); // manifesto recriado
    const res = await update({
      targetDir: dir,
      dryRun: true,
      normalizeLinks: false,
      formatNormalize: true,
    });
    assert.equal(res.mode, "3way");
  });
});
