# Pipeline de desenvolvimento

Como uma ideia vira código neste método. É a **espinha** que conecta o
discovery, os agentes de conceituação/documentação/spec ([agents/](./agents/README.md)),
o protocolo de gates e o ciclo Cowork↔Claude Code do [spec-guide](./spec-guide.md).

## Visão geral

```
0 discovery → 1 conceituação → 2 doc-funcional → 3 gerador-spec → 4 Claude Code → 5 review/reconciliação
  (kickoff)     (reqs/ldoc+hdoc)  (como-funciona)    (specs/)        (código+report)   (decisões de impl.)
                      └──────────────── protocolo-de-gates governa os gates ──────────────┘
```

## Os estágios

**0 · Discovery / kickoff** — [agente-kickoff](./agents/agente-kickoff.md). Entender o problema antes da
solução: build-vs-buy, orçamento de serviços externos, o que o framework
NÃO faz, volume, decisões de stack e **esboço** de modelo de dados. A porta
de entrada humana é a skill `project-kickoff` (quando instalada) ou `npx
project-docs-blueprints init`; o [agente-kickoff](./agents/agente-kickoff.md) é a diretriz
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
[_overview](./_overview.template.md) + [_open-issues](./_open-issues.template.md).

**4 · Implementação** — Claude Code, **uma spec por sessão**: lê
[CLAUDE.md](../CLAUDE.md) → a spec → os `docs/` referenciados →
implementa → reporta (critérios ✅/❌ + decisões). Detalhe do ciclo e das
regras operacionais no [spec-guide](./spec-guide.md).

**5 · Review / reconciliação** — Cowork cruza os critérios com o código
real e preenche "Decisões de implementação" na própria spec. A **volta de
reconciliação** (corrigir conceituação/funcional contra o que foi de fato
construído, puxando das decisões de implementação) é **fase futura** dos
agentes — ainda não especificada.

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

## Pipeline inteiro vs trecho curto

- **Projeto novo de produto:** pipeline inteiro (0→5). O discovery e a
  conceituação pagam o custo quando há produto a descobrir.
- **Mudança pequena / projeto pequeno:** entrar direto no trecho
  spec→implementa→review (estágios 3-5), sem conceituação formal. O
  [spec-guide](./spec-guide.md) cobre esse caminho (inclui "fixes vs specs").

## Onde mora cada coisa

| Estágio | Ferramenta |
| --- | --- |
| Discovery (0) | Skill `project-kickoff` + humano |
| Conceituação, doc-funcional, gerador-spec, review (1-3, 5) | Cowork (sessão com acesso aos arquivos) |
| Implementação (4) | Claude Code (sessão dedicada apontando pro repo) |
| Gates | Transversal — [protocolo-de-gates](./agents/protocolo-de-gates.md) |

---

_Método vivo. Validado pela 1ª vez ponta a ponta no **trade-bot-painel**
(2026-06), Incremento 1. Tratar como hipótese até acumular mais runs._
