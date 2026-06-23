# Comece aqui — setup de docs com `project-docs-blueprints`

Este arquivo foi criado por `npx project-docs-blueprints init`. Ele é o
ponto de partida para inicializar a documentação e o contexto de IA deste
projeto.

---

## Para o humano

Abra seu agente de IA (Claude Code, Cowork, etc.) **neste diretório** e peça:

> "Leia o arquivo `START-HERE.md` e siga as instruções."

O agente vai escolher o perfil, rodar o scaffolder e te guiar a partir daí.
Depois que `docs/` e `CLAUDE.md` forem gerados, você pode **apagar este arquivo**.

---

## Para a LLM — instruções (siga literalmente)

Seu objetivo: inicializar a documentação/contexto deste projeto rodando o
scaffolder `project-docs-blueprints`, escolhendo o perfil certo. O CLI é
determinístico e não-interativo (só flags, sem prompts).

### 1. Escolha o perfil

| Use `--profile ssr` se… | Use `--profile cli` se… |
|---|---|
| App web com SSR/SSG (Next.js, Remix) | Script Node de terminal (sem HTTP) |
| Tem API routes + UI React | Tem um loop principal (infinito/periódico) |
| Precisa de auth, formulários, componentes | I/O com lib externa (broker, AI API, fila) |
| Persiste via ORM (Prisma/Postgres) | Persiste em arquivos locais / DB, sem UI |

Se não der pra decidir com segurança, **pare e pergunte ao humano**. Não chute.

### 2. Cheque as pré-condições

- Node >= 18 (`node --version`).
- O diretório **não** pode já ter `docs/` ou `CLAUDE.md`. Se tiver, o comando
  aborta — veja a seção de erros abaixo.
- Defina o **nome do projeto** e, se `ssr`, a **porta** (default 3000).

### 3. Rode o comando

```bash
# SSR (web):
npx project-docs-blueprints --name <nome> --profile ssr --port 3000 --dir .

# CLI (script/loop):
npx project-docs-blueprints --name <nome> --profile cli --dir .
```

### 4. Verifique o sucesso

A saída deve terminar com `✔ docs criados...` e `✔ CLAUDE.md criado...`,
exit code 0. Confirme que existe `CLAUDE.md` na raiz e a pasta `docs/`.

### 5. Se der erro

- **"Já existe ... Use --force"** → o projeto já tem `docs/` ou `CLAUDE.md`.
  **NÃO use `--force` por conta própria** (sobrescreve sem merge, pode apagar
  trabalho). Pergunte ao humano, ou gere em `--dir` temporário e copie só o
  que falta.
- **`--profile` inválido** → use exatamente `cli` ou `ssr`.
- **Falta `--name`/`--profile`** → forneça as flags.

### 6. Depois de gerar

1. Revise o `CLAUDE.md` e preencha os placeholders `{...}` restantes (stack,
   descrição, princípio arquitetural). Só `{PROJECT_NAME}` e `{PORT}` já vêm
   preenchidos.
2. `git init`, se ainda não for um repositório.
3. Conduza o fluxo a partir de `docs/pipeline.md` (discovery → conceituação →
   doc-funcional → geração de spec) e escreva a primeira spec em
   `specs/setup/00-*.md` seguindo `docs/spec-guide.md`.

### Limitações a ter em mente

- Não faz merge com `docs/`/`CLAUDE.md` existentes (só aborta ou sobrescreve
  com `--force`).
- O merge interno do `CLAUDE.md` é concatenação (base + extensão), não fusão
  semântica → sempre revise.
- Substitui só `{PROJECT_NAME}` e `{PORT}`; demais `{...}` são manuais.
- Só perfis `cli` e `ssr`.
