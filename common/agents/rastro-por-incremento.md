# Rastro por Incremento — `llm-report-inc{N}.md`

> Mecanismo **transversal** do pipeline: cada estágio deixa um **rastro factual**
> do que fez e por quê, num arquivo por incremento. O **Review.LLM** consome esse
> rastro para levantar candidatos a falha de processo **sozinho** — em vez de
> depender de o humano ter percebido e trazido o caso. Tira o humano do papel de
> *sensor* (continua sendo *juiz* no gate). Canônico — cada agente referencia
> este arquivo em vez de redefinir o formato localmente.

**Terminologia (fixa):**

- **Rastro** — o conjunto de seções no `llm-report-inc{N}.md`, uma por estágio que rodou no incremento.
- **Fato vs. interpretação** — o agente registra **o que fez e por quê** (fato); **nunca** "se desviou/errou/saiu do escopo" (interpretação cega — ver Premissa 1).

---

## Por que existe

O Review.LLM parte de "uma falha já diagnosticada com o humano". Mas hoje esse
diagnóstico é **trabalho manual do humano** — ler a transcrição e perceber o
desvio. Sem isso, o Review.LLM fica **cego**: casos como "Review.Code fez operação
de branch", "update foi pra 0.5.1 sozinho" ou "Review.Product criou um discovery
órfão" só existem porque o humano os percebeu.

O rastro muda isso: cada agente deixa um registro factual do que fez, e o
Review.LLM **lê o rastro e infere os candidatos**. O humano deixa de ser o sensor
obrigatório; vira o juiz que decide no gate.

Dois problemas que o desenho evita (análogos funcionais da "preguiça" numa LLM):

1. **O report compete com a tarefa pela atenção** → vindo depois do trabalho pesado, sai raso.
2. **O agente é cego para o próprio desvio** → quem fez o fast-forward de branch não achava que estava saindo do escopo. Pedir auto-report do desvio é pedir ao agente para julgar a própria cegueira.

---

## As três premissas

### 1. Factual, não interpretativo

Registre **o que fez** e **por quê** — fato sobre a ação e o raciocínio, não
julgamento sobre acerto. O agente do fast-forward não escreve "desviei"
(interpretação cega), escreve "rodei `git fast-forward` + `push` porque as branches
divergiram" (fato). **O Review.LLM lê o fato e infere o desvio** — o julgamento
mora no auditor de fora, nunca no agente que cometeu.

### 2. Parcialmente mecânico

Quanto mais o report for **derivado de rastro que já existe**, menos depende de o
agente "lembrar de escrever bem".

| Camada | Fonte | Quem produz |
| --- | --- | --- |
| **Mecânico** | arquivos criados/editados, comandos, commits/diffs | extraído de git/fs |
| **Factual não-mecânico** | qual decisão tomou numa bifurcação + o **porquê** | o agente (fato sobre o raciocínio) |
| **Não se registra** | "se desviou / errou / saiu do escopo" | **ninguém** — interpretação cega; o Review.LLM infere |

### 3. Parte do entregável, não apêndice

Anexar a seção é **critério de conclusão do estágio** — o estágio não fecha sem
ela, como o **M1** (Decisões de implementação) é seção obrigatória da spec.

---

## Formato da seção (por estágio)

Curto — perto de "alguns bullets no fim do estágio", não um relatório:

```
## {estágio/agente} — {data} — session:{id se disponível}
**Fez (mecânico):** {arquivos tocados, comandos, commits — extraível de git/fs}
**Decidiu:** {decisões em bifurcações — uma linha cada}
**Porquê:** {a razão de cada decisão — fato sobre o raciocínio}
**Fora do óbvio:** {ações que não eram o caminho default, como FATO, sem julgar se
foram certas. Ex.: "rodei operação de branch", "criei um .md de discovery", "segui
pra versão 0.5.1 que saiu no processo". Se não houve, omitir.}
```

> A linha **"Fora do óbvio"** é o coração do mecanismo — pede o **fato** ("rodei X"),
> não a interpretação ("desviei"). O agente relata o não-default; o Review.LLM julga.

**`session:{id}` é oportunista e não-bloqueante.** Registre o id da sessão **se o
ambiente o expuser** ao agente; se não houver como obtê-lo, **omita o campo**. É um
ponteiro para o Review.LLM reconstruir o que a sessão fez — não uma exigência
cumprível por todo ambiente.

---

## Ciclo de vida do arquivo

- **Nasce** no início do incremento — o primeiro estágio a rodar cria, ou o
  `agente-prod-runner` cria vazio no re-entry.
- **Cresce** em série: cada estágio anexa sua seção ao passar (estágios rodam em
  sequência, não em paralelo — concorrência de escrita baixa).
- **É lido** pelo Review.LLM no fim do incremento (modo contínuo).

---

## Como o Review.LLM consome

Ganha uma **segunda fonte** de candidatos, além de "falha que o humano trouxe":

- **Lê o rastro** e **cruza com o git diff** (evidência primária) — e com o log da sessão, se o `session:{id}` permitir e o log existir. Persegue os **gaps relato × realidade** e **levanta candidatos** a falha de processo.
- **Propõe ao gate, não conclui.** Ler o report gera **falsos positivos** — nem todo "fora do óbvio" é falha. O Review.LLM **aponta**; o humano **decide**. O report tira o humano de *sensor*, não de *juiz*.
- Daí, o fluxo normal: validar que é real, classificar por tipo, checar reincidência na fila meta, propor correção com gate. Detalhe da investigação em [agente-review-llm](./agente-review-llm.md) (Fase 0).

---

## Obrigação em cada agente de incremento

Uma linha no contrato de saída de **cada** agente que roda num incremento
(conceituação, doc-funcional, gerador-spec, implementação, Review.Code, User
Review, Review.Product). O **Review.LLM é a exceção**: ele **consome** o report
(não anexa) — auto-anexar seria auditar o próprio rastro.

> **Antes de fechar o estágio, anexe sua seção ao `llm-report-inc{N}.md`**
> (fez / decidiu / porquê / fora-do-óbvio). Critério de conclusão — o estágio não
> fecha sem ela. Registre **fato**, nunca julgamento sobre acerto.

---

## Riscos honestos (vigiar)

- **Report sem leitor apodrece** — só se paga se o Review.LLM consumir. Nasce *junto* com o consumo.
- **Custo de escrita** — se custar metade do trabalho real, sai mal ou é pulado. Manter em "alguns bullets"; maximizar a camada mecânica.
- **Falso positivo** — o Review.LLM aponta "fora do óbvio" que era decisão certa. Por isso aponta-candidato, e o gate humano filtra.
- **Mexe em todos os agentes** — a linha de obrigatoriedade entra em cada diretiva. É o custo de ser entregável, não apêndice.

---

## Padrão, não remendo

Mesmo princípio — **rastro consolidado por incremento, factual, consumido por um
auditor** — em três artefatos:

1. **`llm-report-inc{N}.md`** (este) — rastro de processo, consumido pelo Review.LLM.
2. **`prod-runner-diagnostico.md`** — o que o prod-runner viu e por que roteou (decisão de roteamento auditável; ver `agente-prod-runner.md`/`agente-kickoff.md`).
3. **`reqs/review-result-inc{N}.md`** — consolidação do resultado da volta (revisões) por incremento, lida pela conceituação no re-entry, para não poluir o ldoc nem fazer a conceituação catar pedaço em várias filas. _(a desenhar)_
