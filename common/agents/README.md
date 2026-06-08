# Agentes do pipeline

Diretivas reutilizáveis dos agentes que levam uma ideia até specs
implementáveis. Cada arquivo é o prompt/diretriz de um **estágio** do
pipeline. Visão geral e costura com o resto do método em [[pipeline]].

| Arquivo | Estágio | Entrega |
|---|---|---|
| [[agente-conceituacao\|agente-conceituacao]] | Conceituação (Estágio 1) | `reqs/ldoc.md` + `reqs/hdoc.md` — dor→conceito, casos de uso, roadmap de incrementos, DER amplo, Incremento 1 detalhado |
| [[agente-documentacao-funcional\|agente-documentacao-funcional]] | Documentação funcional | `funcional/como-funciona.ldoc.md` + `.hdoc.md` — como a app funciona e como usar |
| [[agente-gerador-spec\|agente-gerador-spec]] | Geração de spec | `specs/{domínio}/NN.md` no template do [[spec-guide]] |
| [[protocolo-de-gates\|protocolo-de-gates]] | (transversal) | Regras de gate e calibragem por stakes, comuns a todos os agentes |

## Como se conectam

```
conceituação → documentação funcional → gerador de spec → Claude Code (implementa)
   (ldoc/hdoc)      (como-funciona)         (specs/)         via spec-guide
        └──────────── protocolo-de-gates governa os gates ────────────┘
```

- **LDoc** (`.md`, para LLM ler) é a **fonte da verdade** de cada estágio;
  o **HDoc** é sempre **derivado** do LDoc, nunca editado à mão. Não são
  templates de arquivo aqui — nascem da execução dos agentes no projeto.
- O `gerador-spec` **consome** o [[spec-guide]] (template, critérios meta
  M1-M4, granularidade) — não duplica essas regras.
- O `protocolo-de-gates` é a **fonte canônica** de gate/stakes; os
  critérios meta M1-M3 do [[spec-guide]] são a aplicação dele à etapa de
  spec (checklist binário vence atenção textual).

## Origem

Extraído do projeto **trade-bot-painel** (2026-06), onde o pipeline
rodou de ponta a ponta no Incremento 1 (conceituação → funcional →
3 specs verticais em `monitor/`). Primeira validação real; tratar como
método vivo até acumular mais runs.
