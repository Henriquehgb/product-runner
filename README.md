# Templates — projetos TypeScript com AI-assisted development

Templates vivos pra começar projetos novos. **Versionados em git;
evoluem conforme aprendizados de projetos reais.**

## Estrutura

```
templates/
├── common/                  ← universal (qualquer projeto Node/TS)
│   ├── pipeline.md          ← a espinha: discovery → spec → implementação
│   ├── design-principles.md
│   ├── spec-guide.md
│   ├── claude-md.template.md
│   ├── _overview.template.md
│   ├── _open-issues.template.md
│   ├── lessons-learned.md
│   └── agents/              ← diretivas do pipeline (conceituação, doc-funcional,
│       └── …                  gerador-spec, protocolo-de-gates)
├── profile-cli/             ← extensões pra CLI / script Node
│   ├── README.md
│   ├── code-patterns.md
│   └── claude-md.extension.md
└── profile-ssr/             ← extensões pra web SSR (Next.js etc.)
    ├── README.md
    ├── code-patterns.md
    ├── api-patterns.md
    ├── ui-patterns.md
    └── claude-md.extension.md
```

## Como usar pra começar projeto novo

### Fluxo guiado por LLM (`init`) — mais simples

```bash
# No diretório do projeto:
npx project-docs-blueprints init
```

Isso coloca um `START-HERE.md` na raiz. Aí é só abrir sua LLM (Claude
Code/Cowork) no diretório e pedir: **"leia `START-HERE.md` e siga as
instruções"** — ela escolhe o perfil, roda o scaffold e te guia a partir
dali.

### Via CLI direto (`npx`)

```bash
# 1. Cria o repo
mkdir meu-projeto && cd meu-projeto

# 2. Roda o scaffolder (não-interativo, pensado pra rodar por LLM ou humano)
npx project-docs-blueprints --name meu-projeto --profile ssr --port 3000 --dir .
#   --profile cli | ssr        perfil de templates
#   --port <n>                 porta default (substitui {PORT})
#   --dir <path>               diretório alvo (default: atual)
#   --force                    sobrescreve docs/ e CLAUDE.md existentes
#   --help                     ajuda completa

# 3. git init + primeira spec setup/00
```

O CLI:
- copia `common/` + `profile-{cli|ssr}/` pra `docs/` (sem os fragmentos de CLAUDE.md);
- gera o `CLAUDE.md` raiz mesclando `claude-md.template.md` + `claude-md.extension.md`;
- substitui `{PROJECT_NAME}` e `{PORT}`. Os demais placeholders `{...}` ficam
  pra você (ou o LLM) preencher na revisão.

### Manual (sem npm)

```bash
cp -r common/* docs/
cp -r profile-ssr/* docs/   # ou profile-cli/
# mescla os dois claude-md num único CLAUDE.md raiz e adapta os {...}
```

Método completo (discovery → conceituação → doc-funcional → geração de
spec → implementação) em [pipeline](common/pipeline.md); formato e critérios da spec em
[spec-guide](common/spec-guide.md). `cp -r common/*` já traz `pipeline.md`, `agents/` e o
`_overview.template.md`.

## Como evolui

**Vivo, versionado em git.** Quando aprender algo novo em projeto real:

1. Atualiza o template aqui.
2. Commit explicando o aprendizado.
3. Eventualmente propaga pro projeto que motivou o aprendizado.

Snapshots de **projetos** em momentos específicos ficam em
`../life-manager/files-organizer/retrospectiva/snapshots/` — servem
como histórico imutável de "como o projeto X estava em data Y".

## Origem do conteúdo atual

| Pasta | Origem |
|---|---|
| `common/` | Merge: DocManager (`retro-20260419`) + tradeBot (`tradebot-202605`) — pega o estado da arte de cada um |
| `common/agents/` + `common/pipeline.md` | **trade-bot-painel** (2026-06) — pipeline de agentes validado no Incremento 1; `_overview.template.md` recuperado do `retro-20260419` |
| `profile-cli/` | Snapshot tradeBot 2026-05-01 (final do ciclo de refactor estrutural) |
| `profile-ssr/` | DocManager (`retro-20260419`) + atualizações importadas do tradeBot (princípios LLM-first, M1/M2/M3, etc.) |

## Quando NÃO usar este template

- Projeto experimental de 1 dia que não vai evoluir.
- Projeto onde a stack diverge muito (ex: Rust, Python — princípios
  podem inspirar mas estrutura concreta não cabe).
- Refactor de projeto existente que já tem outro padrão consolidado
  (esse é caso de adaptar incrementalmente, não copiar template).

## Anti-pattern: editar templates em sessão de projeto

Templates devem ser editados **em sessão dedicada** (Cowork apontando
pra este repositório de templates), não enquanto você está implementando
spec de outro projeto. Senão acumula churn entre o template e o
projeto real, e fica difícil saber qual é fonte da verdade.

Exceção: anotação rápida de aprendizado em [lessons-learned](common/lessons-learned.md) ou
em [_candidates-for-extraction](_candidates-for-extraction.md) — pode ser feita inline no
projeto, mas a refatoração do template formal vem em sessão própria.
