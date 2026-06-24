# Overview das specs

> **Template.** Mapa das specs do projeto: roadmap, dependências, estado.
> Gerado e mantido junto com o gerador de spec (ver [pipeline](./pipeline.md)).
> Substitua os `{placeholders}` pelos do projeto.
>
> **Índice derivado, não fonte.** Este mapa é conveniência e **drift-a**. O
> estado real de cada spec é o **conteúdo da spec** (critérios marcados,
> veredito de review). Não responda "qual a próxima etapa" a partir desta
> tabela — confirme na spec. Mesmo princípio LDoc→HDoc. Como descobrir a
> etapa pelo rastro: [pipeline](./pipeline.md) ("Em que estágio estou?").

## Princípio de organização

Roadmap por **corte vertical**: cada unidade entrega valor visível de
ponta a ponta (dados → lógica → interface), não por camada horizontal
(todos os models → todos os services → toda a UI).

Duas formas, conforme o projeto:

- **Por incremento de produto** — projetos que passam pelo pipeline de
  conceituação. Cada incremento é uma fatia de valor (1+ casos de uso),
  decomposto em N specs verticais pelo [agente-gerador-spec](./agents/agente-gerador-spec.md).
- **Por fase/domínio** — projetos menores, sem conceituação formal. Specs
  agrupadas por domínio estável; numeração indica ordem.

Specs vivem em `specs/{domínio}/NN-nome.md`. Domínios são estáveis; o
roadmap é estável-mas-não-congelado (re-entry pode reordenar à luz do que
se aprende).

## Fundação (`setup/`)

| Spec | Entrega | Status |
| --- | --- | --- |
| `setup/00-{bootstrap}` | {infra base, tooling} | ⏳ pendente |
| `setup/01-{...}` | {...} | ⏳ pendente |

## Incremento 1 — {nome}  _(ou: Fase 1 — {nome})_

**Valor:** {o que entrega de ponta a ponta}. Cobre {UCs / escopo}.

| Spec | Entrega | Depende de | Status |
| --- | --- | --- | --- |
| `{domínio}/01-{...}` | {fatia vertical com resultado visível} | `setup/...` | ⏳ pendente |
| `{domínio}/02-{...}` | {...} | `{domínio}/01` | ⏳ pendente |
| `{domínio}/03-{...}` | {fecha o ciclo mínimo} | `{domínio}/01` | ⏳ pendente |

## Incrementos/Fases seguintes (baixa resolução)

Detalhados só na vez deles (re-entry da conceituação, se aplicável).

| # | Nome | Valor | UCs |
| --- | --- | --- | --- |
| 2 | {...} | {...} | {...} |
| 3 | {...} | {...} | {...} |

## Grafo de dependências

```
setup/00 → setup/01 → {incremento/fase 1}
                     ↘ {incremento/fase 2}
{incremento 1} → {o que depende dele}
```

## Resumo das entities

| Entity | Domínio | Descrição |
| --- | --- | --- |
| {...} | {...} | {...} |

---

_Documento vivo. Atualizar ao implementar specs e ao detalhar novos
incrementos. Dependências são duras: spec que depende de outra não
implementada → parar e reportar (regra do [spec-guide](./spec-guide.md))._
