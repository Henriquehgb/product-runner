# Agentes do pipeline

Diretivas reutilizáveis dos agentes que levam uma ideia até specs
implementáveis. Cada arquivo é o prompt/diretriz de um **estágio** do
pipeline. Visão geral e costura com o resto do método em [pipeline](../pipeline.md).

| Arquivo | Estágio | Entrega |
|---|---|---|
| [agente-pdb](./agente-pdb.md) | (entrada / ciclo de vida) | Porta única (`leia agente-pdb.md e siga`): diagnostica o estado do projeto e roteia (kickoff / conceituação / adoção legada / manutenção); cuida de scaffold, manifesto, `update`, migrations e verificação de versão |
| [agente-kickoff](./agente-kickoff.md) | Discovery (Estágio 0) | Briefing (ex.: `Kickoff.md`) — problema, build-vs-buy, arquitetura/stack, perfil, esboço de modelo de dados; entrega à conceituação |
| [agente-conceituacao](./agente-conceituacao.md) | Conceituação (Estágio 1) | `reqs/ldoc.md` + `reqs/hdoc.md` — dor→conceito, casos de uso, roadmap de incrementos, DER amplo, Incremento 1 detalhado |
| [agente-documentacao-funcional](./agente-documentacao-funcional.md) | Documentação funcional | `funcional/como-funciona.ldoc.md` + `.hdoc.md` — como a app funciona e como usar |
| [agente-gerador-spec](./agente-gerador-spec.md) | Geração de spec | `specs/{domínio}/NN.md` no template do [spec-guide](../spec-guide.md) |
| [protocolo-de-gates](./protocolo-de-gates.md) | (transversal) | Regras de gate e calibragem por stakes, comuns a todos os agentes |

## Como se conectam

```
discovery → conceituação → documentação funcional → gerador de spec → Claude Code (implementa)
 (briefing)   (ldoc/hdoc)      (como-funciona)         (specs/)         via spec-guide
                  └──────────── protocolo-de-gates governa os gates ────────────┘
```

- O `agente-pdb` é a **porta de entrada** (não é um estágio): o humano sempre
  abre por ele (`leia agente-pdb.md e siga`), e ele diagnostica o projeto e
  despacha pro galho certo — inclusive a **adoção de projeto legado** (docs sem
  manifesto → `update` que traz pra gestão). Também é o dono da verificação
  periódica de atualização. No `init` ele vem na raiz junto do `kickoff`; depois
  do scaffold vive aqui em `docs/agents/`.

- O `kickoff` é o **Estágio 0**: faz o discovery (problema, arquitetura,
  esboço de dados) e **entrega o briefing** à conceituação. Como o discovery
  acontece antes de o projeto existir, a porta de entrada humana é a skill
  `project-kickoff` (quando instalada) ou `npx project-docs-blueprints init`;
  este agente é a **diretriz versionada** desse estágio, copiada para
  `docs/agents/` no scaffold.

- **LDoc** (`.md`, para LLM ler) é a **fonte da verdade** de cada estágio;
  o **HDoc** é sempre **derivado** do LDoc, nunca editado à mão. Não são
  templates de arquivo aqui — nascem da execução dos agentes no projeto.
- O `gerador-spec` **consome** o [spec-guide](../spec-guide.md) (template, critérios meta
  M1-M4, granularidade) — não duplica essas regras.
- O `protocolo-de-gates` é a **fonte canônica** de gate/stakes; os
  critérios meta M1-M3 do [spec-guide](../spec-guide.md) são a aplicação dele à etapa de
  spec (checklist binário vence atenção textual).

## Origem

Extraído do projeto **trade-bot-painel** (2026-06), onde o pipeline
rodou de ponta a ponta no Incremento 1 (conceituação → funcional →
3 specs verticais em `monitor/`). Primeira validação real; tratar como
método vivo até acumular mais runs.
