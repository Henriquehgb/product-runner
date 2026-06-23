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

Detalhes do perfil em `claude-md.extension.md` mesclado (do `profile-{cli|ssr}/` correspondente).

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
- [pipeline](./docs/pipeline.md) — como uma ideia vira spec: discovery → conceituação →
  doc-funcional → geração de spec → implementação. Agentes em
  [agents/](./docs/agents/README.md); gates em [protocolo-de-gates](./docs/agents/protocolo-de-gates.md)
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

### Onde mora cada coisa

| Etapa                                     | Ferramenta                                       |
| ----------------------------------------- | ------------------------------------------------ |
| Análise, decisão, escrita de spec, review | Cowork (Claude.ai com acesso aos arquivos)       |
| Implementação                             | Claude Code (sessão dedicada apontando pro repo) |

### Ciclo

1. Cowork analisa, escreve spec, grava em `specs/`.
2. Claude Code implementa.
3. Cowork revisa contra critérios de aceite, preenche
   "Decisões de implementação" na própria spec (se Code esqueceu).
4. Próxima spec.

### Ao implementar uma spec (Claude Code)

1. Ler a spec inteira antes de começar.
2. Verificar "Depende de" — se a dependência não está implementada, parar.
3. Consultar `docs/` referenciados.
4. Implementar mudanças.
5. Rodar critérios de aceite — confirmar cada um.
6. Reportar: critérios ✅/❌/⚠️ + decisões de implementação + notas.

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

Roadmap completo em [_overview](./docs/_overview.template.md).

| #   | Spec                        | Status                     |
| --- | --------------------------- | -------------------------- |
| 00  | {Primeira spec}             | {⏳ pendente / ✅ feito}   |
| ... | ...                         | ...                        |
