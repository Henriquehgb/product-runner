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

```bash
# 1. Cria o repo
mkdir ~/Developer/meu-projeto && cd ~/Developer/meu-projeto

# 2. Copia common + perfil apropriado
cp -r ~/Developer/templates/common/* docs/
cp -r ~/Developer/templates/profile-ssr/* docs/   # ou profile-cli/

# 3. Mescla os dois claude-md (template + extension) num único CLAUDE.md
#    raiz do projeto. Adapta valores ({PROJECT_NAME}, {STACK}, etc.).

# 4. git init + primeira spec setup/00
```

Método completo (discovery → conceituação → doc-funcional → geração de
spec → implementação) em [[pipeline]]; formato e critérios da spec em
[[spec-guide]]. `cp -r common/*` já traz `pipeline.md`, `agents/` e o
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
pra `~/Developer/templates/`), não enquanto você está implementando
spec de outro projeto. Senão acumula churn entre o template e o
projeto real, e fica difícil saber qual é fonte da verdade.

Exceção: anotação rápida de aprendizado em [[lessons-learned]] ou
em [[_candidates-for-extraction]] — pode ser feita inline no
projeto, mas a refatoração do template formal vem em sessão própria.
