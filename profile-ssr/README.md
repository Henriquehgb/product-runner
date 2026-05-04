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
| [[profile-ssr/code-patterns\|code-patterns]] | Estrutura de pastas, schemas Zod, services, repository, mapper toOutput |
| [[api-patterns]] | API routes Next.js, validação, respostas, erros |
| [[ui-patterns]] | Componentes React, formulários, Tailwind, **responsividade mobile** |
| [[profile-ssr/claude-md.extension\|claude-md.extension]] | Seções específicas pra SSR (Next.js, deploy, comandos) |

## Como combinar com `common/`

```bash
cp ~/Developer/templates/common/*.md     meu-projeto/docs/
cp ~/Developer/templates/profile-ssr/*.md meu-projeto/docs/

cat ~/Developer/templates/common/claude-md.template.md \
    ~/Developer/templates/profile-ssr/claude-md.extension.md \
    > meu-projeto/CLAUDE.md
```

## Origem

Conteúdo extraído de:
- **DocManager** (`retro-20260419`) — base SSR Next.js + Prisma + shadcn/ui
- **tradeBot** (`tradebot-202605`) — atualizações importadas:
  - Princípios LLM-first (em [[design-principles]])
  - Critérios meta M1/M2/M3 (em [[spec-guide]])
  - [[_open-issues.template|_open-issues template]] (em `common/`)
  - Adições de responsividade mobile e integração com skill
    `ui-design-system` (em [[ui-patterns]] deste perfil)

## Anti-pattern: usar este perfil pra projeto CLI

Stack assume request/response + UI. CLI sem isso. Use `profile-cli/`.
