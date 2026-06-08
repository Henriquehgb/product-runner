# Protocolo de Gates

> Regras de gate e de calibragem por stakes, **comuns a todos os agentes do pipeline**. Cada agente referencia este arquivo em vez de redefinir as regras localmente — fonte de verdade única, sem drift entre agentes. Mantenha este arquivo na mesma pasta dos agentes.

---

## Por que este arquivo existe

Os agentes erravam o mesmo ponto: **declaravam rigor de gate e depois cediam a um "ok" genérico em ponto de alto risco.** Regra em prosa que o agente "lembra" é insuficiente — é o mesmo aprendizado dos critérios meta do `spec-guide` (checklist binário vence atenção textual). Este protocolo troca autocontrole por procedimento.

---

## 1. Stakes calibram tudo

Antes de cada decisão, classifique: errar aqui é **caro/irreversível (alto risco)** ou **barato/reversível (baixo risco)**? A classificação calibra três coisas: profundidade de investigação, rigor de gate, e exigência de confirmação.

A **classificação** é discricionária — é o julgamento do agente. A **execução** depois dela não é (ver §2). Investigação que não reduz risco e só cansa o humano é falha, não virtude.

---

## 2. Procedimento de gate

- **Baixo risco:** declare a interpretação/suposição e **siga**. Sem turno de confirmação dedicado. Mantém o fluxo leve.
- **Alto risco:** emita uma **lista numerada** dos itens que precisam de confirmação. O gate **só fecha** quando cada item recebe confirmação que o referencia.
  - Resposta genérica ("ok", "está ok", "sim", "pode seguir") a um gate de alto risco **não fecha o gate**. Você **não tem discrição** para aceitá-la: a classificação de risco já foi feita; genérico é, por definição, gate aberto.
  - Ao receber genérico, **re-apresente os itens numerados e peça confirmação por item** (uma vez, sem repetir indefinidamente).
  - Silêncio nunca é aprovação.

---

## 3. Validação diferencial (valores verificáveis)

Se um artefato contém **valores verificáveis** — contas, números, critérios de aceite binários — esses valores são **automaticamente itens de alto risco** (§2), porque serão consumidos a jusante como referência de comportamento.

- Mostre a conta/derivação explicitamente.
- No gate, conduza o humano a confirmar **os valores**, não só "o documento parece bom". Peça confirmação do resultado, não da aparência.

---

## Anti-padrões

- Declarar rigor ("ok genérico não fecha aqui") e depois fechar com ok genérico.
- Aceitar "está ok" sobre artefato com contas sem que os números tenham sido confirmados.
- Usar a classificação de risco como desculpa para pular a checklist no que já foi classificado como alto.
- Aplicar a checklist pesada a **tudo**, inclusive baixo risco — isso reintroduz o "massivo" e treina o humano a carimbar.

---

## Limite honesto

Este protocolo é **mais forte que regra em prosa, não à prova de falha**. Um LLM ainda pode violar regra explícita. A única validação real é rodar e observar — trate como hipótese até ter evidência de runs.
