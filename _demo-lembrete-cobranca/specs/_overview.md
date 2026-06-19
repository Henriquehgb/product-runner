# Overview das specs — Lembrete de Cobrança Mensal

> Mapa das specs: roadmap, dependências, estado. Mantido junto com o
> gerador de spec (ver `pipeline.md`).

## Princípio de organização

Roadmap por **corte vertical** (por incremento de produto): cada spec entrega
valor visível de ponta a ponta. Specs em `specs/{domínio}/NN-nome.md`.

## Fundação (`setup/`)

| Spec | Entrega | Status |
| --- | --- | --- |
| `setup/00-bootstrap` | TS+Zod+Prettier+Vitest; carrega e valida `clientes.json` + config (fail-fast); lista clientes ativos | ✅ implementada |

## Incremento 1 — Lembrete com 1 clique

**Valor:** sistema descobre quem vence, monta Pix + mensagem + link `wa.me` e
entrega no Telegram pra você enviar com 1 clique. Cobre CU1(básico), CU2, CU3, CU4.

| Spec | Entrega | Depende de | Status |
| --- | --- | --- | --- |
| `cobranca/01-cobranca-pronta` | Seleção (competência + janela inclusive + idempotência) + Pix copia-e-cola + mensagem + link `wa.me` | `setup/00` | ✅ implementada |
| `cobranca/02-rodada-telegram` | Rodada agendada: resumo no Telegram, marca lembrado, persiste estado, GitHub Actions | `cobranca/01` | ✅ implementada · envio real validado na mão (2026-06-19) · ⏳ Action no cron pendente-humano |

## Incrementos seguintes (baixa resolução)

Detalhados só na vez deles (re-entry da conceituação).

| # | Nome | Valor | UCs |
| --- | --- | --- | --- |
| 2 | Controle de pago/devendo | Marca pago pelo Telegram; resumo mostra quem pagou e quem falta | CU5, CU6 |
| 3 | Ciclo automático + atrasados | Vira o mês sozinho; re-cobra atrasados | CU7, CU8 |
| 4 | Gestão de clientes pelo bot | Cadastrar/editar cliente conversando com o bot | CU1(completo) |

## Grafo de dependências

```
setup/00 → cobranca/01 → cobranca/02
```

## Resumo das entities

| Entity | Domínio | Descrição |
| --- | --- | --- |
| Cliente | setup | nome, telefone, valorMensal, diaVencimento, ativo |
| Config | setup | chavePix, recebedor (nome/cidade), Telegram, diasAntecedencia |
| Cobranca | setup/cobranca | clienteId, competencia, status, dataLembrete |
| Elegivel / CobrancaPronta | cobranca | derivados em runtime (seleção + Pix + mensagem + link) |

---

_Documento vivo. Dependências são duras: spec que depende de outra não
implementada → parar e reportar (regra do `spec-guide.md`)._
