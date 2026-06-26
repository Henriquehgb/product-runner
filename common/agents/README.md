# Agentes do pipeline

Diretivas reutilizáveis dos agentes que levam uma ideia até specs
implementáveis. Cada arquivo é o prompt/diretriz de um **estágio** do
pipeline. Visão geral e costura com o resto do método em [pipeline](../pipeline.md).

| Arquivo | Estágio | Entrega |
|---|---|---|
| [agente-prod-runner](./agente-prod-runner.md) | (entrada / ciclo de vida) | Porta única (`leia agente-prod-runner.md e siga`): diagnostica o estado do projeto e roteia (kickoff / conceituação / adoção legada / manutenção); cuida de scaffold, manifesto, `update`, migrations e verificação de versão |
| [agente-kickoff](./agente-kickoff.md) | Discovery (Estágio 0) | Briefing (ex.: `Kickoff.md`) — problema, build-vs-buy, arquitetura/stack, perfil, esboço de modelo de dados; entrega à conceituação |
| [agente-conceituacao](./agente-conceituacao.md) | Conceituação (Estágio 1) | `reqs/ldoc.md` + `reqs/hdoc.md` — dor→conceito, casos de uso, roadmap de incrementos, DER amplo, Incremento 1 detalhado |
| [agente-documentacao-funcional](./agente-documentacao-funcional.md) | Documentação funcional | `funcional/como-funciona.ldoc.md` + `.hdoc.md` — como a app funciona e como usar |
| [agente-gerador-spec](./agente-gerador-spec.md) | Geração de spec | `specs/{domínio}/NN.md` no template do [spec-guide](../spec-guide.md) |
| [agente-review-code](./agente-review-code.md) | Review.Code (Estágio 5) | Veredito técnico: cada critério × código real (grep/teste/diff), achados classificados |
| [agente-user-review](./agente-user-review.md) | User Review (Estágio 5) | Roteiro de teste de usabilidade + tratamento do feedback (corte binário) |
| [agente-review-product](./agente-review-product.md) | Review.Product (Estágio 5) | Feedback classificado por causa-raiz e roteado ao destino + fila de produto |
| [agente-review-llm](./agente-review-llm.md) | Review.LLM (Estágio 5, meta) | Correção do **próprio pipeline** a partir de falha já diagnosticada |
| [protocolo-de-gates](./protocolo-de-gates.md) | (transversal) | Regras de gate e calibragem por stakes, comuns a todos os agentes |
| [review-result](./review-result.md) | (volta → conceituação) | Canal das **correções de concepção** da volta (`reqs/review-result-inc{N}.md`): User Review/Review.Product anexam, a conceituação lê no re-entry — sem poluir o ldoc |
| [rastro-por-incremento](./rastro-por-incremento.md) | (transversal) | Rastro factual por incremento (`llm-report-inc{N}.md`) que cada estágio anexa e o Review.LLM consome pra levantar candidatos a falha de processo |

## Como se conectam

```
discovery → conceituação → doc funcional → gerador de spec → Claude Code → review
 (briefing)   (ldoc/hdoc)   (como-funciona)    (specs/)       (implementa)    │
                  └────────── protocolo-de-gates governa os gates ────────────┘
                                                                               │
review (Estágio 5):  Review.Code → User Review → Review.Product → Review.LLM
                     (veredito)    (uso humano)   (roteia)        (corrige pipeline)
                        └─ Impeditivo escala: User Review → Review.Product → Conceituação
```

- O `agente-prod-runner` é a **porta de entrada** (não é um estágio): o humano sempre
  abre por ele (`leia agente-prod-runner.md e siga`), e ele diagnostica o projeto e
  despacha pro galho certo — inclusive a **adoção de projeto legado** (docs sem
  manifesto → `update` que traz pra gestão). Também é o dono da verificação
  periódica de atualização. No `init` ele vem na raiz junto do `kickoff`; depois
  do scaffold vive aqui em `docs/agents/`.

  Ao rotear pro kickoff, a costura **não é muda** — passa por um artefato de rastro:

  ```
  agente-prod-runner → prod-runner-diagnostico.md (oportunista) → agente-kickoff
  ```

  O prod-runner registra **o que viu e por que roteou** (factual); o kickoff lê e
  **parte dali** em vez de re-levantar o básico. Nunca-bloqueante: sem o arquivo,
  o kickoff faz o reconhecimento do zero.

- O `kickoff` é o **Estágio 0**: faz o discovery (problema, arquitetura,
  esboço de dados) e **entrega o briefing** à conceituação. Como o discovery
  acontece antes de o projeto existir, a porta de entrada humana é a skill
  `project-kickoff` (quando instalada) ou `npx product-runner init`;
  este agente é a **diretriz versionada** desse estágio, copiada para
  `docs/agents/` no scaffold.

- **LDoc** (`.md`, para LLM ler) é a **fonte da verdade** de cada estágio;
  o **HDoc** é sempre **derivado** do LDoc, nunca editado à mão. Não são
  templates de arquivo aqui — nascem da execução dos agentes no projeto.
- O `gerador-spec` **consome** o [spec-guide](../spec-guide.md) (template, critérios meta
  M1-M4, granularidade) — não duplica essas regras.
- Os **fluxos de review** (Estágio 5) rodam **por incremento entregue**, depois
  da implementação: **Review.Code** (técnico, cruza critério × código) →
  **User Review** (usabilidade, julgamento humano) → **Review.Product**
  (roteia o feedback por causa-raiz) → **Review.LLM** (corrige o próprio
  pipeline). Um **Impeditivo** achado no Review.Code bloqueia e escala pra
  concepção. Eles agem **depois do código** (por isso vêm após o diagrama de
  "como uma ideia vira spec") — detalhe e rastro de cada um em
  [pipeline](../pipeline.md) §5 e "Em que estágio estou?".
- O `protocolo-de-gates` é a **fonte canônica** de gate/stakes; os
  critérios meta M1-M3 do [spec-guide](../spec-guide.md) são a aplicação dele à etapa de
  spec (checklist binário vence atenção textual).
- O [rastro-por-incremento](./rastro-por-incremento.md) é **transversal**: cada estágio
  anexa uma seção factual (fez/decidiu/porquê/fora-do-óbvio) ao `llm-report-inc{N}.md`,
  e o **Review.LLM** lê esse rastro pra levantar candidatos a falha de processo
  sozinho — tirando o humano do papel de *sensor* (segue *juiz* no gate).

## Origem

Extraído do projeto **trade-bot-painel** (2026-06), onde o pipeline
rodou de ponta a ponta no Incremento 1 (conceituação → funcional →
3 specs verticais em `monitor/`). Primeira validação real; tratar como
método vivo até acumular mais runs.
