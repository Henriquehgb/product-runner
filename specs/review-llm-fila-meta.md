# Review.LLM — Fila meta

> Registro persistente das **causas de falha de processo**. O modo **contínuo escreve** (uma entrada por causa, com seu tipo); o modo **por marco lê** (consolida para a retrospectiva). É a fonte da **detecção de reincidência**: ao registrar, consulta-se a fila por **tipo igual** (não "parecido") — match = reincidência.

## Formato de entrada

```
## {tipo: T1..T7 | nao-categorizado} — {título curto} — {data}
**Origem:** {run/sessão/agente onde a falha apareceu}.
**Causa (co-diagnosticada com humano):** {a razão pela qual errou}.
**Reincidência:** {primeira vez | match com entrada de {data} (mesmo tipo)}.
**Tratamento:** {só registrou (isolada) | propôs correção X (gate) | integridade entre .md (gate)}.
**Status:** REGISTRADA | CORRECAO PROPOSTA | CORRECAO APLICADA | CONSOLIDADA EM MARCO.
```

---

(sem entradas ainda — preenchida quando o Review.LLM rodar)
