# Review.LLM — Lista de tipos (fechada)

> Lista **fechada** de tipos de falha de processo. Governa a classificação e a detecção de reincidência (match exato de tipo na fila meta). O Review.LLM **não cria tipo no calor da classificação** — falha sem tipo correspondente vira **"não-categorizado"** e é reportada; adicionar/ajustar tipo é **manutenção com gate**, em conjunto com o humano.

> **Semente:** os tipos abaixo foram observados de fato durante o desenho do pipeline (runs reais e a própria iteração das diretivas). Não são inventados — cada um aconteceu pelo menos uma vez.

---

## Tipos conhecidos

### T1 — Cedeu a OK genérico em ponto de alto risco
O agente declarou rigor de gate e depois fechou com "ok"/"está ok" genérico onde havia decisão de alto risco pendente.
*Correção típica:* mecanizar (procedimento de checklist), não reforçar prosa. (Origem do `protocolo-de-gates.md`.)

### T2 — Inferiu conteúdo do dado a partir do schema
Tratou um schema frouxo (`z.unknown()`, campo opcional) como evidência de que o dado é vazio/inexistente.
*Correção típica:* regra "schema é forma, não evidência de conteúdo" + confronto com dado real quando houver.

### T3 — Apresentou como gap algo que já existia (leu artefato velho)
Afirmou que faltava algo que já estava num artefato/quadro, por ter lido versão desatualizada ou não ter lido.
*Correção típica:* validar que a falha é real antes de corrigir; conferir versão do artefato.

### T4 — Detalhou/comprometeu além do escopo do incremento
Produziu detalhe ou compromisso de incrementos futuros, violando a assimetria de resolução.
*Correção típica:* reforço de escopo travado / não-objetivos explícitos.

### T5 — Decisão de design não tomada mascarada por texto plausível
Escreveu conteúdo coerente por cima de um buraco de decisão, em vez de expor a decisão pendente ao humano.
*Correção típica:* forçar a decisão à tona (FORK explícito) antes de redigir por cima.

### T6 — Inconsistência entre artefatos de fonte da verdade
O mesmo fato aparece divergente em mais de um artefato (ldoc vs. como-funciona vs. template; tipo `string` vs `number`; roadmaps concorrentes).
*Correção típica:* verificação de integridade com gate; reconciliar a fonte única.

### T7 — Misturou papéis (revisor virou executor/concebedor)
Um estágio de revisão tentou corrigir/conceber em vez de registrar e escalar, cruzando a fronteira de competência.
*Correção típica:* reforçar a fronteira de competência + caminho de escalada.

---

## Manutenção (com gate)

- **Não-categorizado:** falha que não casa com T1–T7 → registrar como `não-categorizado` e reportar ao humano.
- **Proposta de novo tipo / fusão:** quando houver não-categorizados acumulados (ou um caso óbvio), o Review.LLM **propõe** adicionar um tipo ou tratar como variação de um existente. **Alto risco** (contamina a detecção de reincidência) → passa pelo gate. Só o humano aprova a mudança da lista.
