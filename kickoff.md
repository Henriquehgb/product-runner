---
name: project-kickoff
description: >
  Processo para levar um projeto novo do problema ao código com ferramentas
  AI (Claude Code, Cowork). Cobre o discovery — levantamento de requisitos,
  decisões de arquitetura e modelo de dados — e entrega o projeto ao
  pipeline de specs. Ativar quando o usuário quiser começar um projeto novo,
  planejar um sistema do zero, ou montar a estrutura de desenvolvimento com
  AI ("preciso de um sistema para...", "quero começar um projeto", "como
  estruturo um projeto novo", "me ajuda a planejar"). Referencia a skill
  it-analyst para análise técnica e troubleshooting.
---

# Project kickoff

Processo para levar um projeto do problema ao código, com ferramentas
AI (Claude Code, Cowork, Claude.ai).

> **Onde esta skill encaixa (porta de entrada do pipeline).** Esta é a
> entrada de **discovery** de um projeto novo — as etapas 1-2 (entender o
> problema + arquitetura) são o forte dela e não existem nos agentes do
> pipeline. Da **conceituação** em diante, passe o bastão aos agentes dos
> templates (`common/`):
>
> - `agents/agente-conceituacao.md` — conceito, casos de uso, roadmap de
>   incrementos, DER amplo, com gates (1·1.5·2·3) → produz `reqs/ldoc.md` + `hdoc.md`.
> - `agents/agente-documentacao-funcional.md` — `funcional/como-funciona.ldoc.md`.
> - `agents/agente-gerador-spec.md` — corta o incremento em specs no `spec-guide`.
> - `spec-guide.md` + Claude Code — implementação.
>
> Visão geral em `common/pipeline.md`. Esta skill **não substitui** esses
> agentes — faz o discovery e entrega o projeto a eles.

## Etapas

### 1. Levantamento de requisitos

Entender o problema antes de propor solução.

- Perguntas fechadas (múltipla escolha) pra acelerar.
- Ordem: O QUÊ / PRA QUEM → VIABILIDADE → COMO.
- Pesquisar soluções prontas do mercado antes de decidir por custom.
  Se houver, avaliar com honestidade se atendem.
- Entender orçamento de serviços externos (APIs, cloud) cedo —
  custos recorrentes impactam viabilidade técnica.
- Mapear volume (dados, usuários, requests) pra dimensionar.

Se o problema envolver troubleshooting ou análise de sistema
existente, acionar a skill `it-analyst`.

### 2. Decisões de arquitetura

Definir stack, estrutura e padrões.

- Mapear o que o framework/plataforma NÃO faz — limitações
  definem deploy e arquitetura tanto quanto features.
- Discutir iterativamente — proposta inicial, ouvir
  contra-propostas, refinar. Não entregar solução fechada.
- Documentar o "porquê" de cada decisão, não só o "quê".
- Checklist de decisões:
  - [ ] Stack (linguagem, framework, ORM, banco)
  - [ ] Plataforma de deploy (local, cloud, VPS)
  - [ ] Padrão de dados (validação, tipos, derivações)
  - [ ] Estrutura de pastas
  - [ ] Estilização (CSS framework, component lib)
  - [ ] Integrações externas (APIs, serviços)
  - [ ] Background jobs (fila, worker)
  - [ ] Autenticação (se aplicável)
- A decisão de stack determina o **perfil** dos templates a aplicar:
  `profile-cli` (script/loop) ou `profile-ssr` (web). Consultar
  `templates/common/design-principles.md` para princípios reutilizáveis.

### 3. Modelo de dados

Definir entities e relações antes de código.

- Modelar JUNTO com o usuário — gaps conceituais que o técnico
  não vê.
- Decisões conceituais antes do schema:
  - 1:1 vs 1:N vs N:M
  - Registros vs JSON
  - Enum vs booleanos independentes
  - Nullable vs required
- ERD visual pra alinhar entendimento.
- Validar modelo COMPLETO antes de implementar.
- Modelar pra evolução aditiva: nullable, enums extensíveis,
  constraints que podem ser adicionados sem migração destrutiva.

> **Handoff:** o modelo de dados **definitivo** (DER amplo + estrutura por
> incremento, com gates) é responsabilidade do `agente-conceituacao`. Aqui
> basta o esboço que destrava as decisões de arquitetura; não refine o DER
> à mão — deixe o agente conduzir com OK por gate.

### 4. Dev workflow

Montar o processo de desenvolvimento.

- Definir papéis das ferramentas:
  - Claude.ai = pensar, decidir, specs
  - Cowork = agir nos arquivos, revisar
  - Claude Code = implementar, testar
- Spec-first: escrever spec → implementar → revisar → próxima.
- Organizar specs por domínio, não por fase.
- Fases/incrementos com CORTE VERTICAL (ponta a ponta) em vez de
  camada por camada. Cada fatia entrega valor visível.
- Overview com grafo de dependências.
- Critérios de aceite binários (passa / não passa).
- Padrão de comunicação: instrução copiável pro Cowork/Code.
- Fixes (bugs, ajustes) vão direto sem spec.

> **Handoff:** o workflow detalhado, o template de spec e os critérios meta
> (M1-M4) vivem em `templates/common/spec-guide.md`; a costura completa do
> método em `common/pipeline.md`. Não redefinir aqui — referenciar.

### 5. Skills e documentação

Preparar o contexto para as ferramentas.

- CLAUDE.md na raiz (skill global do Claude Code) — montar a partir de
  `templates/common/claude-md.template.md` + a `claude-md.extension.md`
  do perfil escolhido.
- docs/ com referência por concern — copiar de `templates/common/` +
  `profile-{cli|ssr}/`.
- Skills do Cowork com YAML frontmatter.
- Verificar formato esperado de cada ferramenta ANTES de gerar.
- Guardrails comportamentais no CLAUDE.md:
  - Regra dos 3 strikes (parar após 3 tentativas).
  - Spec vs realidade técnica (apresentar tradeoff).
  - Fixes não precisam de spec.
  - Port fixo + report do port real.
- Formatter (Prettier) + hooks de commit desde o dia zero.

### 6. Implementação

Executar as specs.

- Uma spec por vez, na ordem do grafo de dependências.
- Claude Code recebe: "leia docs X, implemente spec Y".
- Report final do Claude Code = artefato mais valioso.
- Divergências spec↔código documentadas na spec (M1).
- Validação visual no browser é insubstituível.
- CLAUDE.md é documento vivo — adicionar regras conforme
  problemas surgem.

> **Handoff:** as specs são geradas pelo `agente-gerador-spec` (a partir da
> conceituação) e implementadas pelo Claude Code seguindo o `spec-guide`.

### 7. Retrospectiva

Extrair lições ao final de cada fase ou do projeto.

- Etapa formal, não opcional.
- Fazer com a mesma ferramenta que conduziu o projeto.
- Gerar artefatos concretos: lições, melhorias no template, regras novas.
- Separar o que é específico do projeto do que é reutilizável.
- Propagar o reutilizável de volta aos templates:
  `templates/common/lessons-learned.md` e
  `templates/_candidates-for-extraction.md` (padrão que aparece em
  3 projetos vira template universal).

## Artefatos gerados no kickoff

| Artefato | Quando criar |
|---|---|
| Conceito + roadmap (`reqs/ldoc.md` / `hdoc.md`) | Discovery → handoff ao `agente-conceituacao` |
| CLAUDE.md | Etapa 5 (a partir do template + extension do perfil) |
| docs/*.md (padrões) | Etapa 5 (copiados de common/ + perfil) |
| specs/_overview.md | Etapa 4 (roadmap; do `_overview.template.md`) |
| specs/setup/00-*.md | Etapa 5 (infra) |
| Skills do Cowork | Etapa 5 |
| Prettier + lint-staged | Etapa 5 (setup/00-01) |

## Anti-patterns

- Decidir stack antes de entender o problema.
- Entregar arquitetura fechada sem iterar.
- Implementar sem spec.
- Spec com mais de ~150 linhas.
- Fases horizontais (modelo inteiro → services inteiros → UI inteira).
- Tentar prever tudo no planejamento.
- Retrospectiva "quando der tempo" (nunca dá).
- **Refinar conceito/DER/specs à mão aqui** em vez de entregar aos agentes
  do pipeline (conceituação → gerador-spec).
