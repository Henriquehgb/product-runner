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

## Manutenção dos protocolos de doc

Estes docs e este `CLAUDE.md` vieram de `project-docs-blueprints`. A versão e a
origem de cada arquivo ficam em `docs/.project-docs-blueprints.json` (manifesto).

### Verificação de atualização (no máximo 1×/dia)

No início de uma sessão de trabalho, antes de mergulhar na tarefa, faça esta
checagem — **no máximo uma vez por dia**, e nunca aplicando nada sem o humano:

1. **Trava de data.** Leia `docs/.pdb-update/.last-check`. Se a data for hoje,
   **pule** toda esta rotina.
2. **Estado atual:**
   - **Sem manifesto** (`docs/.project-docs-blueprints.json` não existe) → o
     projeto é legado/desatualizado: vá ao passo 4 usando `--profile <cli|ssr>`.
   - **Com manifesto** → rode `npm view project-docs-blueprints version` e
     compare com o campo `version` do manifesto. Sem rede / comando falhou →
     registre a data (passo 5) e siga com a tarefa, não trave.
3. **Com manifesto e SEM versão nova:** registre a data (passo 5) e siga.
4. **Atualização** (versão nova, ou projeto sem manifesto):
   1. Rode `npx project-docs-blueprints@latest update --dry-run` (com
      `--profile <cli|ssr>` se não houver manifesto).
   2. Resuma o plano ao humano (quantos _adiciona_ / _auto-merge_ / _revisar_) e
      **pergunte se quer atualizar agora**. Se adiar, registre a data e siga.
   3. Com OK: garanta o git limpo (commit/stash), rode o mesmo comando **sem**
      `--dry-run`, e revise o `git diff`.
   4. Para cada handoff em `docs/.pdb-update/*.handoff.md`, **conduza a decisão
      com o humano**: cada arquivo traz a versão atual e a nova — classifiquem
      juntos o que é melhoria do template (trazer) vs customização do projeto
      (preservar) e gravem a versão final. Em conflito real, exponha o tradeoff,
      não decida sozinho.
   5. Se algo executável mudou, rode typecheck/testes.
5. **Registre a checagem:** grave a data de hoje (`YYYY-MM-DD`) em
   `docs/.pdb-update/.last-check` (crie a pasta se preciso).

> **Gitignore:** adicione `docs/.pdb-update/` ao `.gitignore` — é área de
> trabalho efêmera (handoffs + marcador de data), não versionada.

**Nunca** rode `update` sem `--dry-run` (nem `--force`) sem o humano aprovar o plano.
