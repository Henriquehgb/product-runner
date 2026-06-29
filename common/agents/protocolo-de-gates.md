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

## 4. Trava de papel (transversal)

Cada execução tem **um papel**, **uma etapa** e um **output definido no contrato de saída** daquele agente. A trava protege a fronteira: uma execução não muda de papel no meio do caminho.

**A regra.** Se o trabalho exigir produzir algo que **não é o output do seu papel** — outro artefato, ou a saída de outra etapa — isso **não é continuação do seu trabalho; é mudança de papel, e você não a faz.** Pare e devolva ao humano.

**O gatilho é o tipo de output, não a auto-percepção.** Não pergunte "sinto que saí do papel?" — você é cego para o próprio desvio (se o enxergasse, não o faria). Ancore num sinal **objetivo: o que o seu papel entrega.** A pergunta mecânica é sempre:

> **"o que estou prestes a produzir é o output declarado no meu contrato de saída?"**

Se não é, pare — mesmo que o trabalho seja útil, pareça a continuação óbvia, ou o humano tenha pedido de um jeito que sugira isso. O gatilho é o **tipo de output**, não o quanto parece natural:

- Conceituação entrega `ldoc`/`hdoc`. Se a ação produz código (`.tsx`/`.ts`), build ou componente → **não é output da Conceituação** → cruzamento.
- Review.Code entrega veredito + achados classificados. Se a ação modifica o repo (operação de branch, conserto de código) → cruzamento.
- Review.Product entrega roteamento + fila. Se a ação concebe, investiga ou faz discovery de um incremento → cruzamento.

**Ao detectar o cruzamento, pare e devolva ao humano** numa mensagem curta: (1) o que foi pedido; (2) que está **fora do seu papel/etapa** (nomeie o seu — "estou na Conceituação"); (3) que fazê-lo quebraria o processo; (4) qual estágio parece ser o dono — **como informação, não como ação**. Depois pare: **quem decide trocar de papel é o humano.**

**Não** execute o trabalho do outro papel; **nem roteie/despache** pra ele — acionar outro agente é fazer o roteamento do prod-runner, que também não é o seu papel (**sinalizar ≠ rotear**); nem "só adiante um pouco" (meio-cruzamento é cruzamento).

**Instrução ambígua não é licença.** Um pedido curto/ambíguo ("faça os ajustes", "resolve isso") **não autoriza** sair do papel. Na dúvida, **a leitura válida é a que te mantém no papel** — o resto você sinaliza.

> **Exemplo (real).** Na Conceituação em re-entry, o humano disse "os ajustes primeiro". Duas leituras: (a) "reconcilie a concepção dos ajustes primeiro" → output `ldoc`, **dentro** do papel; (b) "implemente os ajustes" → output código, **fora** do papel. A trava obriga a leitura (a). Se o humano queria mesmo a implementação, ele confirma quando você parar e avisar — o default nunca é cruzar o papel por uma palavra ambígua.

**Trabalho adjacente: sinalize, nunca execute.** Perceber trabalho útil de outro papel (um discovery que o próximo incremento vai precisar, um bug adjacente, um refactor) e **sinalizá-lo** é output legítimo — informação ao humano, registrada no canal próprio (`_open-issues.md`, `product-issues.md`). **Executá-lo não é** — é cruzamento. Não existe "adjacente com OK na hora": se o humano quer o adjacente feito, isso é uma **nova execução** do papel dono daquilo, decidida por ele.

**Por que existe.** Quem cruza papel raramente percebe — o cruzamento parece a continuação natural do pedido. A proteção não pode depender de o agente sentir o desvio; depende de ancorar no output (objetivo) e devolver a decisão ao humano (o juiz). É a disciplina dos gates — parar e devolver ao humano — aplicada à fronteira de papel, não à de avanço.

---

## Anti-padrões

- Declarar rigor ("ok genérico não fecha aqui") e depois fechar com ok genérico.
- Aceitar "está ok" sobre artefato com contas sem que os números tenham sido confirmados.
- Usar a classificação de risco como desculpa para pular a checklist no que já foi classificado como alto.
- Aplicar a checklist pesada a **tudo**, inclusive baixo risco — isso reintroduz o "massivo" e treina o humano a carimbar.
- **Executar ou rotear** trabalho de outro papel no meio da execução — os dois são cruzamento (executar = virar o outro agente; rotear = virar o prod-runner). Ver §4 Trava de papel.

---

## Limite honesto

Este protocolo é **mais forte que regra em prosa, não à prova de falha**. Um LLM ainda pode violar regra explícita. A única validação real é rodar e observar — trate como hipótese até ter evidência de runs.
