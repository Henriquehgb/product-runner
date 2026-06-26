# Pipeline de desenvolvimento

Como uma ideia vira código neste método. É a **espinha** que conecta o
discovery, os agentes de conceituação/documentação/spec ([agents/](./agents/README.md)),
o protocolo de gates e o ciclo spec → implementação → review do [spec-guide](./spec-guide.md).

## Visão geral

```
0 discovery → 1 conceituação → 2 doc-funcional → 3 gerador-spec → 4 implementação → 5 review
  (kickoff)     (reqs/ldoc+hdoc)  (como-funciona)    (specs/)        (código+report)    │
                      └────────────── protocolo-de-gates governa os gates ───────────┘  │
                                                                                         ↓
5 · review (sub-cadeia):  Review.Code → User Review → Review.Product → Review.LLM
                          (veredito)    (uso humano)   (roteia)        (corrige pipeline)
                             └─ Impeditivo escala: User Review → Review.Product → Conceituação
```

## Os estágios

**0 · Discovery / kickoff** — [agente-kickoff](./agents/agente-kickoff.md). Entender o problema antes da
solução: build-vs-buy, orçamento de serviços externos, o que o framework
NÃO faz, volume, decisões de stack e **esboço** de modelo de dados. A porta
de entrada humana é a skill `project-kickoff` (quando instalada) ou `npx
product-runner init`; o [agente-kickoff](./agents/agente-kickoff.md) é a diretriz
versionada do estágio, copiada para `docs/agents/` no scaffold. Saída:
decisões consolidadas num briefing (ex.: `Kickoff.md`) + perfil escolhido.

**1 · Conceituação** — [agente-conceituacao](./agents/agente-conceituacao.md). Dor→conceito: diagrama de
conceitos, casos de uso, roadmap de incrementos (baixa resolução), DER
amplo, e o **Incremento 1 detalhado** (estrutura de dados, sequências,
exemplo com critérios). Gates 1 · 1.5 · 2 · 3. Saída: `reqs/ldoc.md` +
`reqs/hdoc.md`.

**2 · Documentação funcional** — [agente-documentacao-funcional](./agents/agente-documentacao-funcional.md). Como a
aplicação funciona e como usar, em tom presente. Roda por incremento,
antes da spec. Saída: `funcional/como-funciona.ldoc.md` + `.hdoc.md`.

**3 · Geração de spec** — [agente-gerador-spec](./agents/agente-gerador-spec.md). Corta o incremento em N
specs verticais no template do [spec-guide](./spec-guide.md), redistribuindo os artefatos
a montante. Gate de corte (alto risco). Saída: `specs/{domínio}/NN.md` +
[_overview](../specs/_overview.md) + [_open-issues](../specs/_open-issues.md).

**4 · Implementação** — **uma spec por sessão** (via `spec-guide`): lê
[CLAUDE.md](../CLAUDE.md) → a spec → os `docs/` referenciados →
implementa → reporta (critérios ✅/❌ + decisões). Detalhe do ciclo e das
regras operacionais no [spec-guide](./spec-guide.md).

**5 · Review** — sub-cadeia própria, rodada **por incremento entregue**,
um agente por papel ([agents/](./agents/README.md)):

1. **Review.Code** ([agente-review-code](./agents/agente-review-code.md)) — review técnico: cruza
   cada critério de aceite com o **código real** (grep, testes, diff), não
   com o report. Rastro: veredito ✅/❌/⚠️ por critério + classificação dos
   achados (correção do ciclo / issue / Impeditivo). Divergências legítimas
   são apontadas para as "Decisões de implementação" da spec — ele não
   reescreve a spec.
2. **User Review** ([agente-user-review](./agents/agente-user-review.md)) — prepara o teste de
   usabilidade (roteiro) e trata o feedback (corte binário ajuste /
   mais-que-ajuste). O julgamento é humano e intransferível. Roda após o
   Review.Code.
3. **Review.Product** ([agente-review-product](./agents/agente-review-product.md)) — hub: classifica
   o feedback por **causa-raiz** e roteia ao destino (Conceituação,
   Doc-funcional, Design System ou Review.LLM). Acumula a fila de produto.
4. **Review.LLM** ([agente-review-llm](./agents/agente-review-llm.md)) — meta: a partir de uma
   falha **já diagnosticada com o humano**, corrige o **próprio pipeline**
   (diretiva, skill, template) pra ela não repetir, e reconcilia a mesma
   inconsistência se ela propagou.

**Impeditivo** (concepção profunda achada no Review.Code) bloqueia o avanço
e escala por User Review → Review.Product → Conceituação; só o humano
bypassa. A **volta de reconciliação** (corrigir conceituação/funcional
contra o que foi construído) é coberta por Review.Product → destino — antes
era fase futura, agora está especificada nos agentes. Tratar como
recém-especificado: método vivo até acumular runs. As correções de
**concepção** da volta não vão direto pro ldoc — passam pelo
`reqs/review-result-inc{N}.md`, que a conceituação lê no re-entry (canônico em
[review-result](./agents/review-result.md)).

## Em que estágio estou? (orientar pelo rastro)

"Qual a próxima etapa" / "X está pronto?" se descobre **lendo o conteúdo
dos artefatos**, não a tabela de status. Cada estágio deixa um **rastro**
detectável; o **primeiro estágio sem rastro é o próximo passo**:

| Estágio | Rastro de que rodou |
| --- | --- |
| 1 conceituação | `reqs/ldoc.md` existe e preenchido |
| 2 doc-funcional | `funcional/como-funciona.ldoc.md` existe |
| 3 gerador-spec | `specs/{domínio}/NN.md` existem + `_overview` populado |
| 4 implementação | report do Code (critérios ✅/❌/⚠️) + **"Decisões de implementação" preenchidas** (critério M1) |
| 5 review | **veredito do Review.Code** (cruzamento critério × código) + saídas de User/Product/LLM (filas de produto/meta) |

> **Cuidado — o erro clássico:** "Decisões de implementação" preenchidas
> são rastro do **estágio 4** (Code as preenche por M1), **não** do review.
> O estágio 5 tem rastro **próprio** (o veredito do Review.Code). Ver uma
> spec com Decisões preenchidas e concluir "review feito" é confundir os
> dois — aconteceu de verdade (ver [lessons-learned](./lessons-learned.md)). Se não há
> veredito de review, **o próximo passo é rodar os fluxos de review.**

**Regra de fonte:** a spec é a **fonte**; `_overview.md` e a tabela de
estado do `CLAUDE.md` são **índice derivado** (mesmo princípio LDoc→HDoc
abaixo). Confirme o status contra o **conteúdo da spec** antes de afirmar ou
sugerir o próximo passo. Se o índice diverge da spec, a **spec ganha** e o
índice é o que se corrige. Nunca responda status a partir de leitura
truncada (`head -N`) do índice.

## LDoc / HDoc

- **LDoc** (`.md`, feito para LLM ler) é a **fonte da verdade** de cada
  estágio. O **HDoc** é sempre **derivado** do LDoc — nunca editado à mão.
  Se o humano pede mudança no HDoc, a mudança entra no LDoc e o HDoc é
  regenerado.
- **Não são templates de arquivo** — nascem da execução dos agentes no
  projeto. Convenção de caminhos: `reqs/` (conceituação), `funcional/`
  (documentação funcional).

## Gates (transversal)

[protocolo-de-gates](./agents/protocolo-de-gates.md) é a **fonte canônica** de gate e calibragem por
stakes: alto risco → lista numerada, "ok" genérico não fecha; valores
verificáveis (contas, critérios) = alto risco automático. Os critérios
meta **M1-M3** do [spec-guide](./spec-guide.md) são a **aplicação** desse princípio à
etapa de spec (checklist binário vence atenção textual — mesmo aprendizado).

## Rastro por incremento (transversal)

Cada estágio que roda num incremento deixa um **rastro factual** (fez / decidiu /
porquê / fora-do-óbvio) num `llm-report-inc{N}.md`. O **Review.LLM** consome esse
rastro pra levantar candidatos a falha de processo **sozinho** — em vez de depender
de o humano ter percebido o desvio. É o mesmo princípio do "índice derivado vs
fonte": rastro factual consumido por um auditor de fora. Canônico em
[rastro-por-incremento](./agents/rastro-por-incremento.md); é critério de conclusão de
cada estágio, não apêndice.

## Pipeline inteiro vs trecho curto

- **Projeto novo de produto:** pipeline inteiro (0→5). O discovery e a
  conceituação pagam o custo quando há produto a descobrir.
- **Mudança pequena / projeto pequeno:** entrar direto no trecho
  spec→implementa→review (estágios 3-5), sem conceituação formal. O
  [spec-guide](./spec-guide.md) cobre esse caminho (inclui "fixes vs specs").

## Onde mora cada coisa

Tudo roda no **mesmo ambiente** (app que roda LLM no repo). A fronteira de sessão é
a **execução de um agente**; o bastão entre sessões é o **arquivo de output**, não o
contexto. O mapa completo (agente → inputs → outputs) está na tabela **Ciclo** do
`CLAUDE.md`.

| Estágio | Como roda |
| --- | --- |
| Discovery (0) | `agente-kickoff` (porta humana: skill `project-kickoff`) |
| Conceituação, doc-funcional, gerador-spec, review (1-3, 5) | um agente por sessão; handoff por arquivo |
| Implementação (4) | sessão dedicada, uma spec por sessão (via `spec-guide`) |
| Gates | transversal — [protocolo-de-gates](./agents/protocolo-de-gates.md) |

---

_Método vivo. Validado pela 1ª vez ponta a ponta no **trade-bot-painel**
(2026-06), Incremento 1. Tratar como hipótese até acumular mais runs._
