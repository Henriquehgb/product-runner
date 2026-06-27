# Product Runner

## TL;DR

**Product Runner** é um conjunto de harness, agentes e runners que conduz a **construção e a evolução de um produto** com low/vibe-coding assistido — do **briefing e discovery** até a **supervisão e aprovação da arquitetura** — mantendo consistência e fazendo o próprio processo evoluir a cada incremento.

```
npx product-runner init   # entrega os agentes de bootstrap; a LLM lê o agente-prod-runner e conduz
```

> Este produto ainda é uma versão Alfa. Método vivo, validado ponta a ponta poucas vezes. Ainda com muitos pontos com oportunidade de evolução e outros tratados como hipótese até acumular runs. Fique à vontade para propor melhorias e sugestões.

Não é "mais um spec-driven": o spec é só um estágio. O que tem dentro:

- 🔗 **Pipeline ponta a ponta** — discovery → conceituação → doc funcional → spec → implementação → review, um agente por estágio (cada um se conecta ao próximo).
- 🚦 **Gates calibrados por risco** — alto risco pede confirmação item a item; "ok" genérico não fecha.
- 🤝 **Handoff por protocolos, ferramentas e arquivos — independente de LLM/conta/sessão** — o bastão entre etapas é por **protocolos automáticos de output no repo git**, não o contexto da conversa. A construção e a evolução do produto não ficam presas a uma LLM, conta ou app: **multi-LLM, multi-conta e múltiplos usuários** podem assumir etapas diferentes do mesmo fluxo.
- 🏗️ **Scaffold por perfil** — gera `CLAUDE.md` + `docs/` a partir de templates vivos (`cli`/`ssr`).

Além disso, o que faz ele ser um pacote de _product runner_ pra valer:

- 🔁 **Método versionado com migrations** — `npx product-runner update` propaga melhorias do processo pra projetos já existentes (não é "instale uma vez").
- 🧠 **Processo auto-evolutivo** — cada estágio deixa um rastro factual por incremento; o **Review.LLM** lê esse rastro e corrige o próprio pipeline quando uma falha reincide.

## Estrutura

```
templates/
├── common/                  ← universal (qualquer projeto Node/TS)
│   ├── pipeline.md          ← a espinha: discovery → spec → implementação
│   ├── design-principles.md
│   ├── spec-guide.md
│   ├── claude-md.template.md
│   ├── lessons-learned.md
│   ├── specs/              ← seeds preenchidos no projeto (_overview, _open-issues)
│   │   └── …
│   └── agents/              ← diretivas do pipeline (prod-runner, kickoff, conceituação,
│       └── …                  doc-funcional, gerador-spec, protocolo-de-gates)
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

### Estrutura depois de aplicado num projeto

A árvore acima é a **do template** (este repo). Quando você roda o scaffold
num projeto, o CLI copia `common/` + `profile-{cli|ssr}/` pra `docs/` (sem os
fragmentos de CLAUDE.md), manda os seeds de `common/specs/` pra `specs/` na
raiz, gera o `CLAUDE.md` raiz (merge template + extensão do perfil) e escreve
o manifesto. O resultado, **perfil `ssr`**:

```
meu-projeto/
├── CLAUDE.md                          ← merge template + extensão do perfil
├── docs/
│   ├── .product-runner.json  ← manifesto (marca o projeto como "gerido")
│   ├── pipeline.md
│   ├── design-principles.md
│   ├── spec-guide.md
│   ├── lessons-learned.md
│   ├── README.md                      ← do perfil
│   ├── code-patterns.md
│   ├── api-patterns.md                ← só ssr
│   ├── ui-patterns.md                 ← só ssr
│   ├── DESIGN-SYSTEM.md               ← só ssr
│   └── agents/
│       ├── README.md
│       ├── agente-prod-runner.md              ← porta de entrada (roteia kickoff/manutenção/adoção)
│       ├── agente-kickoff.md
│       ├── agente-conceituacao.md
│       ├── agente-documentacao-funcional.md
│       ├── agente-gerador-spec.md
│       ├── agente-review-code.md
│       ├── agente-review-llm.md
│       ├── agente-review-product.md
│       ├── agente-user-review.md
│       └── protocolo-de-gates.md
└── specs/
    ├── _overview.md                   ← visão geral (você preenche)
    └── _open-issues.md                ← issues abertas (você preenche)
```

> `docs/.prod-runner-update/` aparece só **durante** um `update` (handoffs efêmeros) —
> mande pro `.gitignore`.

O **perfil `cli`** é igual, mas sem `api-patterns.md`, `ui-patterns.md` e
`DESIGN-SYSTEM.md` (que são exclusivos do `ssr`).

## Como usar pra começar projeto novo

### Fluxo guiado por LLM (`init`) — mais simples

```bash
# No diretório do projeto:
npx product-runner init
```

Isso coloca os agentes de bootstrap (`agente-prod-runner.md` +
`agente-kickoff.md`) na raiz. Aí é só abrir sua LLM no diretório (ex.: Claude
Code) e pedir: **"leia `agente-prod-runner.md` e siga"** — ele diagnostica o
projeto, escolhe o perfil, roda o scaffold e te guia a partir dali.

### Via CLI direto (`npx`)

```bash
# 1. Cria o repo
mkdir meu-projeto && cd meu-projeto

# 2. Roda o scaffolder (não-interativo, pensado pra rodar por LLM ou humano)
npx product-runner --name meu-projeto --profile ssr --port 3000 --dir .
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

Templates devem ser editados **em sessão dedicada** (LLM apontando
pra este repositório de templates), não enquanto você está implementando
spec de outro projeto. Senão acumula churn entre o template e o
projeto real, e fica difícil saber qual é fonte da verdade.

Exceção: anotação rápida de aprendizado em [lessons-learned](common/lessons-learned.md) ou
em [_candidates-for-extraction](_candidates-for-extraction.md) — pode ser feita inline no
projeto, mas a refatoração do template formal vem em sessão própria.
