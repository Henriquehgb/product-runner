# {PROJECT_NAME}

{Descrição curta do projeto — 1-2 frases.}

> **Este é um template.** Ao usar, mescle com `profile-{cli|ssr}/claude-md.extension.md`
> da pasta de templates. Substitua valores entre `{}` pelos do projeto.

## Stack

- **Runtime:** {ex: Node.js + TypeScript}
- **Validação:** Zod (schemas como fonte de verdade única)
- **Testes:** Vitest
- **Formatter:** Prettier + lint-staged + husky (desde dia zero)
- {Outras deps específicas do projeto}

## Arquitetura

### Princípio central

{Descrever em 2-3 linhas o princípio arquitetural do projeto.
Exemplos:
- "Lógica de domínio desacoplada do framework. Services são
  TypeScript puro. Camada de orquestração é casca fina que delega."
- "Loop infinito em casca fina. Lógica de trade vive em services
  testáveis com mock de broker."}

### Estrutura de pastas

{Definir conforme perfil do projeto. Ver `profile-{cli|ssr}/code-patterns.md`
pra estrutura recomendada.}

## Docs de referência

Antes de implementar uma spec, consultar o doc relevante:

- [design-principles](./docs/design-principles.md) — princípios técnicos, princípios LLM-first, valores
- [code-patterns](./docs/code-patterns.md) — schemas Zod, services, padrões de código
- [spec-guide](./docs/spec-guide.md) — como ler, escrever e implementar specs
  (inclui critérios meta M1, M2, M3 — e M4 em specs de UI)
- [pipeline](./docs/pipeline.md) — como uma ideia vira spec **e código**: discovery → conceituação →
  doc-funcional → geração de spec → implementação → **review** (Review.Code →
  User Review → Review.Product → Review.LLM). Agentes em
  [agents/](./docs/agents/README.md); gates em [protocolo-de-gates](./docs/agents/protocolo-de-gates.md).
  Para descobrir em que etapa o projeto está, ver "Em que etapa o projeto está" abaixo
- {Outros docs do perfil — [api-patterns](./docs/api-patterns.md) / [ui-patterns](./docs/ui-patterns.md) no SSR}

## Padrão de dados

Zod entity como raiz. Tipos derivam via `z.infer`. Validação na
fronteira (boot, resposta de I/O externo, leitura de arquivo).
Dentro dos services, dados são tipados e confiáveis.

Detalhes em [code-patterns](./docs/code-patterns.md).

## Convenções de código

### Geral

- TypeScript strict mode: começar `false`, migrar gradualmente.
- Arquivos novos em `kebab-case.ts`. Arquivos legados ficam até
  serem refatorados.
- Exportar funções nomeadas, não default exports.
- Sem `any` em código novo. Em código legado, manter até refactor
  da spec correspondente.

### Services e lógica

- Funções puras quando possível (input → output, sem side-effects).
- Services nunca importam módulos de I/O ou framework
  (`fs`, `dotenv`, `process`, libs externas com side-effects).
- Services nunca chamam `console.log` direto. Logs estruturados
  via logger dedicado quando aplicável.
- Side-effects (IO, integração externa, log) ficam em camada
  dedicada (persistence/, integrations/, ou orquestrador).

### Erros

- Lançar classe específica do domínio (ex: `DomainError` ou
  subclasses), nunca `Error` puro em código de domínio.
- Preservar stack trace: `throw error` ou `throw new XxxError(msg, { cause: error })`,
  nunca `throw error.message`.

### Validação

- Toda leitura de I/O externa passa por `Schema.safeParse()`.
- Resposta de lib externa passa por schema parse antes de chegar
  na lógica.
- Dentro de services: zero revalidação. Os dados já estão tipados.

## Workflow de desenvolvimento

Spec-first: cada mudança não-trivial passa por uma spec antes
da implementação.

### Ciclo (fluxo arquivo → arquivo)

Tudo roda no mesmo ambiente (app que roda LLM no repo). A fronteira de sessão é a
**execução de um agente**; o bastão entre sessões é o **arquivo de output**, não o
contexto. Visão geral do fluxo em [pipeline](./docs/pipeline.md).

| Estágio | Agente | Inputs (arquivos) | Outputs (arquivos) |
| --- | --- | --- | --- |
| Entrada / roteamento | `agente-prod-runner` | estado do repo (manifesto, docs, código) | `prod-runner-diagnostico.md` (ao rotear p/ kickoff) |
| 0 · Discovery | `agente-kickoff` | `prod-runner-diagnostico.md` (se houver) | `Kickoff.md` |
| 1 · Conceituação | `agente-conceituacao` | `Kickoff.md`; re-entry: `reqs/ldoc.md` + `reqs/review-result-inc{N}.md` | `reqs/ldoc.md`, `reqs/hdoc.md` · `llm-report-inc{N}.md` |
| 2 · Doc funcional | `agente-documentacao-funcional` | `reqs/ldoc.md`; DS/DP+patterns; `funcional/como-funciona.ldoc.md` (Inc 2+) | `funcional/como-funciona.ldoc.md`, `.hdoc.md` · `llm-report-inc{N}.md` |
| 3 · Gerador de spec | `agente-gerador-spec` | `reqs/ldoc.md`, `funcional/como-funciona.ldoc.md`, `spec-guide.md`, DS/DP | `specs/{domínio}/NN-*.md` · `llm-report-inc{N}.md` |
| 4 · Implementação | (via `spec-guide`) | `specs/{domínio}/NN-*.md`, patterns | código, testes, "Decisões de implementação" na spec, report · `llm-report-inc{N}.md` |
| 5 · Review.Code | `agente-review-code` | spec, código/repo, report | veredito (na spec); achados → spec / `specs/_open-issues.md` · `llm-report-inc{N}.md` |
| 5 · User Review | `agente-user-review` | `funcional/como-funciona.ldoc.md`, consolidado do inc | ajuste→spec; caso-de-uso→`reqs/review-result-inc{N}.md`; mais-que-ajuste→`product-issues.md` · `llm-report-inc{N}.md` |
| 5 · Review.Product | `agente-review-product` | `product-issues.md`, artefatos | roteamento; concepção→`reqs/review-result-inc{N}.md`; processo→`docs/agents/review-llm-fila-meta.md` · `llm-report-inc{N}.md` |
| 5 · Review.LLM | `agente-review-llm` | `llm-report-inc{N}.md` + git diff + logs de sessão (**lê, não escreve**) | correções em diretivas; `docs/agents/review-llm-fila-meta.md` (classifica/mantém); `.md` de marco |
| transversal | `protocolo-de-gates` | herdado por todos | — |

> Nota: "Decisões de implementação" preenchidas são rastro do **estágio 4**
> (implementação, M1), **não** do review (estágio 5, que tem rastro próprio — o
> veredito do Review.Code). Ver "Em que etapa o projeto está".

### Ao implementar uma spec

1. Ler a spec inteira antes de começar.
2. Verificar "Depende de" — se a dependência não está implementada, parar.
3. Consultar `docs/` referenciados.
4. Implementar mudanças.
5. Rodar critérios de aceite — confirmar cada um.
6. Reportar: critérios ✅/❌/⚠️ + decisões de implementação + notas.
7. Anexar a seção do estágio ao `llm-report-inc{N}.md` (fez / decidiu / porquê /
   fora-do-óbvio) — critério de conclusão, não apêndice; registre **fato**, nunca
   julgamento. Detalhe em [rastro-por-incremento](./docs/agents/rastro-por-incremento.md).

### Regras operacionais

- **3 strikes.** Se uma abordagem falhou 3 vezes, parar e relatar.
  Não entrar em loop tentando variações.
- **Spec vs realidade.** Se a spec tem um tradeoff técnico significativo
  na implementação, PARAR e apresentar o caso. Spec é guia, não lei.
- **Menor superfície.** Preferir solução que altera menos arquivos.
- **Não adivinhar.** Se a spec não cobre, perguntar.
- **Mudanças adjacentes vão pra outra spec.** Bug ou refactor tentador
  observado durante implementação não entra na spec atual. Anotar
  em "Decisões de implementação", abrir spec separada se relevante.
  Detalhe em [spec-guide](./docs/spec-guide.md).
- **Leitura consolidada de arquivos grandes.** Antes de fazer
  múltiplos `Read` do mesmo arquivo com offsets diferentes, considerar
  1 leitura com `limit` alto (ex: `limit: 2000` cobre arquivos até
  ~2000 linhas). Custo de tokens da leitura única é menor que custo
  de round-trips fragmentados.
- **Decisões de implementação são obrigatórias.** Toda spec implementada
  termina com essa seção preenchida — escolhas, divergências, tentações
  não feitas. Sem isso, spec está incompleta. Reforçado pelo critério
  meta **M1** (ver [spec-guide](./docs/spec-guide.md)).

### Fixes diretos (sem spec)

Se altera contrato (schema, função pública, comportamento observável
de fora), spec. Se é correção do que já deveria funcionar (typo,
parêntese, condição invertida, ajuste de mensagem), fix direto.

## Comandos úteis

{Definir conforme perfil do projeto.}

## Configuração

{Tabela de arquivos de config + se vão pra git ou não.}

| Arquivo        | Conteúdo                          | Comitado? |
| -------------- | --------------------------------- | --------- |
| `.env`         | Segredos                          | ❌ NUNCA  |
| `.env.example` | Mesmas chaves sem valor           | ✅        |
| {outros}       | ...                               | ...       |

## Estado do refactor / desenvolvimento

> **Índice derivado, não fonte.** Esta tabela e o [_overview](./specs/_overview.md) são
> conveniência e **drift-am**. O estado real de cada spec mora **no conteúdo
> da spec** (critérios marcados, veredito de review), não aqui. Mesmo
> princípio LDoc→HDoc. Se a tabela diverge da spec, a **spec ganha**.

Roadmap completo em [_overview](./specs/_overview.md).

| #   | Spec                        | Status                     |
| --- | --------------------------- | -------------------------- |
| 00  | {Primeira spec}             | {⏳ pendente / ✅ feito}   |
| ... | ...                         | ...                        |

### Em que etapa o projeto está

Antes de dizer "qual a próxima etapa" ou "X está pronto?": **descubra pelo
rastro no conteúdo das specs**, não pela tabela acima.

- Cada estágio do pipeline deixa rastro detectável na spec/artefato; o
  **primeiro estágio sem rastro é o próximo passo**. Tabela de rastros em
  [pipeline](./docs/pipeline.md) ("Em que estágio estou?").
- **Cuidado:** "Decisões de implementação" preenchidas são rastro da
  **implementação** (estágio 4, critério M1), **não** do review. O review
  deixa rastro próprio (veredito do Review.Code). Não confunda — se não há
  veredito de review, o próximo passo é **rodar os fluxos de review**.
- A spec é a fonte; `_overview` e a tabela acima são índice derivado que
  drift-a. Nunca responda status a partir de leitura truncada (`head -N`).

## Manutenção dos protocolos de doc

Estes docs e este `CLAUDE.md` vieram de `product-runner` (manifesto em
`docs/.product-runner.json`). O protocolo completo de manutenção
— diagnóstico do projeto, verificação de versão, `update`, migrations e handoffs —
vive no agente [agente-prod-runner](./docs/agents/agente-prod-runner.md).

**No início de uma sessão de trabalho, ≤ 1×/dia:** siga a *Verificação de
atualização* do [agente-prod-runner](./docs/agents/agente-prod-runner.md) — ele compara a versão
publicada com a do manifesto e, havendo novidade, conduz o `update` com você.
Nunca aplica nada (nem `--force`) sem sua aprovação.

> **Gitignore:** mantenha `docs/.prod-runner-update/` no `.gitignore` — é área de
> trabalho efêmera do `update`, não versionada.
