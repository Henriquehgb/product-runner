# Mecanismo `reqs/review-result-inc{N}.md` — correções de concepção da volta

> Canal **estreito** por onde a **volta** (revisões) pede **mudança de concepção**
> sem poluir o `ldoc.md`. Quando um estágio da volta conclui que a *concepção*
> precisa mudar, ele **não escreve no ldoc** (que é plano, não retrospecto) —
> anexa aqui. A **conceituação** lê este arquivo como **primeira coisa do
> re-entry** do próximo incremento. Canônico — as diretivas referenciam este
> arquivo em vez de redefinir as regras localmente.

**Terminologia (fixa):**

- **Correção de concepção** — feedback cuja causa é o **plano/modelo**, não o código nem a apresentação. É o único tipo que entra aqui.
- **Re-entry** — a re-execução da conceituação para abrir o próximo incremento (pula a Fase 1 macro; ver `agente-conceituacao.md`).

---

## O problema que resolve

A volta de um incremento manda correções para vários lugares por natureza: ajuste
de código → spec; adjacente → `_open-issues.md`; mais-que-ajuste → `product-issues.md`.
Mas **um subconjunto** é "a **concepção** precisa mudar" — cujo destino natural
seria o `ldoc.md` (fonte da conceituação).

Escrever direto no `ldoc.md` tem dois custos: **polui o plano com retrospecto** (o
ldoc deixa de ser "o que vamos construir" e vira "...+ o que descobrimos que
estava errado") e força a conceituação a **catar essas correções no meio do plano**
no re-entry. O `review-result-inc{N}.md` é o canal dedicado: a volta anexa aqui, o
ldoc fica limpo, e a conceituação tem **um lugar único** para ler o que a realidade
pediu antes de conceber o próximo incremento.

---

## Escopo estreito (o que entra e o que NÃO entra)

Entra **só o que iria mexer no `ldoc.md`** — correções de concepção. Dois gatilhos exatos:

| Origem | Gatilho | Por quê entra aqui |
| --- | --- | --- |
| **User Review** | corte binário = **ajuste de caso de uso** (cenário/aceite errado ou incompleto) | corrigir um caso de uso é mexer na concepção → ldoc |
| **Review.Product** | roteamento = causa de **concepção** (modelo/casos de uso/roadmap/DER errados) | é correção de plano → ldoc |

**NÃO entra** (cada um tem seu lugar, sem duplicar):

- ajuste de código → seção de pendências da spec atual;
- adjacente / fora de escopo → `_open-issues.md`;
- mais-que-ajuste que **não** é de concepção (ex.: design) → o destino que o Review.Product roteou (DS, etc.);
- rastro de processo (o que cada agente fez) → `llm-report-inc{N}.md` (eixo diferente — ver abaixo).

> **Não é índice das filas nem cópia delas.** É o canal **específico** das correções de concepção. As outras filas seguem intactas.

---

## Quem escreve, e quando

**Cada estágio da volta anexa o seu** — incremental, sem destilador no fim:

- O **User Review**, ao confirmar no gate um corte "**ajuste de caso de uso**", anexa aqui (em vez de mandar pro ldoc).
- O **Review.Product**, ao rotear no gate um item como "**concepção**", anexa aqui (em vez de mandar pro ldoc).

Cada entrada, factual e curta:

```
## {origem: User Review | Review.Product} — {data}
**Correção de concepção:** {o que o plano/UC precisa mudar}
**Evidência:** {o que na volta revelou isso — qual teste/feedback/achado}
**Alvo no ldoc:** {qual caso de uso / parte do DER / decisão é afetada}
**Refaz UC anterior?** {sim/não — se exige rever um UC de incremento já fechado}
```

---

## Numeração e ciclo de vida

- `{N}` é o **incremento que foi revisado**. A volta do Inc 1 escreve `review-result-inc1.md`; a conceituação o lê ao abrir o Inc 2.
- **Nasce** quando o primeiro estágio da volta do Inc N tem uma correção de concepção a registrar (pode não nascer, se a volta não pediu nenhuma).
- **É lido** pela conceituação na abertura do Inc N+1.

---

## O que a conceituação faz com ele (no re-entry)

**É a primeira coisa do re-entry** — antes de conceber o incremento novo:

1. **Lê o `review-result-inc{N}.md`** como primeira ação do re-entry do Inc N+1.
2. **Reconcilia primeiro, concebe depois.** Trata as correções de concepção — inclusive **refazer um caso de uso do incremento anterior** se `Refaz UC anterior? = sim` — e **fecha isso** antes de abrir o Inc N+1. Não mistura "corrigir o passado" com "conceber o futuro" (misturar é o anti-padrão que o pipeline evita).
3. **Só então** avança para detalhar o incremento novo.
4. O `review-result` é **uma das peças do briefing** do re-entry — junto com o ldoc atual, o roadmap, etc. É a que carrega "o que a realidade do Inc N me ensinou".

> Consequência: o re-entry pode forçar **revisão retroativa** de um UC já fechado. Isso é esperado — é o pipeline pagando a dívida do tom presente / do plano que a implementação contradisse. Passa pelos gates da conceituação como qualquer mudança de alto risco.

---

## Diferente do `llm-report-inc{N}.md` (não confundir)

São os dois "rastro por incremento", mas em **eixos opostos**:

| | `llm-report-inc{N}` | `review-result-inc{N}` |
| --- | --- | --- |
| Natureza | rastro de **processo** | consolidação de **produto** |
| Registra | o que cada agente fez e por quê | o que a volta descobriu que muda a concepção |
| Olha para | **dentro** (o método) | **frente** (o próximo incremento) |
| Consumido por | **Review.LLM** (melhora o pipeline) | **Conceituação** (concebe o próximo incremento) |

Coexistem sem sobrepor. Ver [rastro-por-incremento](./rastro-por-incremento.md).

---

## Riscos honestos (vigiar)

- **Escopo escorregando.** A tentação é jogar aqui qualquer coisa da volta. Só correção de **concepção** (os dois gatilhos). Se virar despejo geral, recria a poluição que o ldoc evitou — num arquivo novo.
- **Arquivo vazio é OK.** Se a volta não pediu correção de concepção, o `review-result-inc{N}` não nasce. Ausência não é erro.
- **Revisão retroativa de UC** é poderosa e perigosa — refazer um UC fechado mexe em concepção consolidada. Por isso passa pelos gates da conceituação.
