# Perfil: Web SSR (Next.js Pages Router)

Use este perfil em projetos que:

- Rodam como **servidor web** com SSR/SSG (Next.js, Remix, etc.).
- Têm **API routes** + **UI React**.
- Precisam de **autenticação**, **formulários**, **componentes interativos**.
- Persistem em DB via ORM (Prisma + Postgres como default), ou em
  arquivos como acoplamento com outros sistemas.

## Conteúdo

| Arquivo | Pra quê |
|---|---|
| [code-patterns](./code-patterns.md) | Estrutura de pastas, schemas Zod, services, repository, mapper toOutput |
| [api-patterns](./api-patterns.md) | API routes Next.js, validação, respostas, erros |
| [ui-patterns](./ui-patterns.md) | Componentes React, formulários, Tailwind, **responsividade mobile** |
| [claude-md.extension](../CLAUDE.md) | Seções específicas pra SSR (Next.js, deploy, comandos) |

## Como combinar com `common/`

Use o CLI — ele copia `common/` + este perfil pra `docs/` e gera o
`CLAUDE.md` raiz (mescla template + extension, substitui `{...}`):

```bash
npx product-runner --name meu-projeto --profile ssr --port 3000 --dir .
```

Equivalente manual, se preferir sem npm:

```bash
cp common/*.md     meu-projeto/docs/
cp profile-ssr/*.md meu-projeto/docs/
cat common/claude-md.template.md profile-ssr/claude-md.extension.md \
    > meu-projeto/CLAUDE.md
```

## Origem

Conteúdo extraído de:
- **DocManager** (`retro-20260419`) — base SSR Next.js + Prisma + shadcn/ui
- **tradeBot** (`tradebot-202605`) — atualizações importadas:
  - Princípios LLM-first (em [design-principles](./design-principles.md))
  - Critérios meta M1/M2/M3 (em [spec-guide](./spec-guide.md))
  - [_open-issues](../specs/_open-issues.md) (seed em `common/specs/`)
  - Adições de responsividade mobile e integração com skill
    `ui-design-system` (em [ui-patterns](./ui-patterns.md) deste perfil)

## Anti-pattern: usar este perfil pra projeto CLI

Stack assume request/response + UI. CLI sem isso. Use `profile-cli/`.
