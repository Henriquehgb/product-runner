# Design principles

Princípios que guiam decisões neste projeto, organizados por
o que ajudam: estrutura técnica do código, ou trabalho da LLM.

Princípios não são "boas práticas genéricas" — são regras
acionáveis com critério claro de violação.

---

## Princípios técnicos

### 1. Fonte de verdade única

Uma definição. Tudo deriva dela. Se um campo muda na fonte,
o que depende dele quebra em compile-time.

**Na prática:**

- `ConfigValuesSchema` (Zod) é a raiz. `type ConfigValues = z.infer<typeof ConfigValuesSchema>`.
- Inputs derivam por `pick`/`extend`. Outputs derivam por `omit`/`extend`.
- Zero `interface` ou `type` escritos à mão que duplique algo do schema.

**Anti-pattern:**

```ts
// ❌ tipo paralelo ao schema, vai sair de sincronia
const ConfigValuesSchema = z.object({ id: z.string(), ... });
interface ConfigValues { id: string; ... }
```

**Por que importa pra LLM:** ela lê 1 schema e sabe todos os tipos.
Não precisa cruzar definições espalhadas.

### 2. Lógica de domínio isolada do framework e libs externas

Funções de cálculo, decisão e regras nunca importam
`@binance/connector`, `dotenv`, `fs`, `process`. Recebem
inputs tipados, retornam outputs tipados.

**Na prática:**

- `recalculateLimits(state, prices, config)` — função pura.
- Acesso à Binance via `BrokerClient` (interface), implementado por `BinanceBroker`.
- Persistência via funções dedicadas (`load`, `save`), nunca dentro da lógica de trade.

**Anti-pattern:**

```ts
// ❌ lógica chamando broker direto
function recalculateLimits(...) {
    const price = await client.tickerPrice(...);
    ...
}
```

**Por que importa pra LLM:** função pura é caixa fechada com
contexto reduzido. LLM consegue raciocinar/testar/refatorar
sem carregar contexto da Binance.

### 3. Fronteira é onde valida

Valida UMA vez, na entrada do sistema. Dentro da lógica,
dados são tipados e confiáveis.

**Na prática:**

- Boot: `ConfigValuesSchema.safeParse(JSON.parse(arquivo))`. Se inválido, fail-fast com mensagem clara.
- Resposta da Binance: `BinanceTickerResponseSchema.parse(response.data)` antes de chegar na lógica.
- Reload de estado: `BotStateSchema.parse(json)` em vez de `Object.setPrototypeOf` cego.
- Dentro de services: zero revalidação. Os dados já estão tipados.

**Anti-pattern:**

```ts
// ❌ confiar em forma sem validar
const price = Number(response.data.price); // se .data ou .price mudar, quebra silencioso
```

```ts
// ❌ revalidar dentro de service
function buyAndSell(state) {
    if (!state.config.tradeSymbol) throw ...; // já validado na entrada
}
```

### 4. Casca fina na borda

A camada de orquestração (loop principal, entrypoint) não pensa.
Recebe, delega, responde.

**Na prática:**

- `index.ts` ≤ 100 linhas. Carrega config, instancia broker, dispara `tradingLoop`.
- Loop em `services/trading/loop.ts`. Decisões em `services/trading/decisions.ts`. Etc.
- Aninhamento máximo no entrypoint: 2 níveis.

**Anti-pattern:**

- `index.ts` com 800 linhas misturando loop, lógica, ordens e persistência. (estado atual — refactor planejado em refactor/06)

---

## Princípios LLM-first

Regras que existem porque LLM como executor tem limitações
específicas: tende a fazer mais que pedido, entra em loops,
"esquece" decisões anteriores.

### 1. Critérios de aceite binários

Toda spec termina com checklist. Cada item passa ou não passa.
Verificável por comando ou observação direta.

**Na prática:**

- `git grep -E '(eNls3mjIoTZ|vIE3NutkqUq6)'` retorna vazio. ✅/❌
- Rodar `npm run start` sem `.env` termina com exit code != 0. ✅/❌

**Anti-pattern:**

- "Implementar de forma robusta" — não verificável.
- "O bot funciona corretamente" — não verificável sem critério.

**Por que importa:** elimina "parcialmente implementado". LLM tem
sinal claro pra parar.

### 2. Escopo travado por não-objetivos explícitos

Toda spec lista "Não-objetivos" antes do checklist.
Sem isso, LLM tende a fazer mais que pedido.

**Na prática:**

```markdown
## Não-objetivos

Esta spec NÃO faz:

- tsconfig.json (vem em setup/01)
- Vitest, testes (setup/01)
- Fix do bug aritmético em makeTradingTurnLog (refactor/03)

Se aparecer tentação, não fazer. Anotar em "Decisões de implementação".
```

**Por que importa:** lista de "não fazer" é mais eficaz que aviso
genérico. Ancoragem específica trava escopo.

### 3. Reportar decisões na própria spec

Após implementação, preencher seção "Decisões de implementação"
da spec. Documentar:

- Divergências do plano original.
- Escolhas entre alternativas (qual e por quê).
- Tentações de escopo que apareceram (não feitas, anotadas).

**Na prática:** ver final de `specs/setup/00-hardening.md`.

**Por que importa:** próxima sessão (humana ou LLM) lê a spec e
sabe o estado real, não o estado planejado. Sem isso, divergência
silenciosa acumula.

### 4. Guardrail dos 3 strikes

Se uma abordagem falhou, tentou variação, falhou de novo,
tentou outra: PARA na 3ª tentativa. Reporta o que tentou
e pede orientação.

**Na prática:** em problemas técnicos novos (erro estranho,
config que não funciona, comportamento inesperado), LLM
não fica iterando indefinidamente.

**Por que importa:** sem isso, sessão entra em loop e acumula
confusão. Vide o caso `searchVector/Prisma` no DocManager.

### 5. Documentar o porquê, não só o quê

Toda decisão arquitetural tem nota explicando o motivo.
CLAUDE.md, docs e specs sempre têm "porquê".

**Na prática:**

- "Usamos `Object.setPrototypeOf` em vez de factory `fromPlain` PORQUE é a substituição mais direta da reanexação manual sem expandir escopo desta spec."
- "Loop sequencial em vez de paralelo PORQUE rate-limit da Binance e simplifica raciocínio sobre estado."

**Anti-pattern:** comentário que descreve o óbvio (`// incrementa contador`)
em vez de explicar a decisão.

**Por que importa:** sem o porquê, decisões são revisitadas a cada
sessão. LLM "redebate" coisas já decididas.

---

## Valores não-acionáveis

Estes não são princípios — são valores culturais. Influenciam
mentalidade mas não dão critério binário.

### Evolução aditiva

**Como cultura:** preferir mudanças que estendem em vez de quebrar.
Campos novos nullable, schemas antigos continuam parseando.

**Como regra acionável:** "Adicionar campo: nullable. Renomear:
criar novo + deprecar. Remover: marcar deprecated em comentário,
remover só após 1 ciclo de uso."

Quando esta segunda forma estiver consolidada, vira princípio
técnico. Por enquanto, é nota.

### Pragmatismo sobre purismo

**Como cultura:** se ferramenta não suporta algo nativamente,
contornar com escape hatch mais simples e documentar.

**Aviso de dívida:** LLM aceita escape hatches com facilidade.
O risco é normalizar `as any`, `// @ts-ignore`, dado mockado em
produção, "deixa pra depois".

**Regra de uso:** qualquer escape hatch (cast, ignore, hack)
DEVE ser documentado em "Decisões de implementação" da spec
com motivo. Sem isso, vira dívida invisível.

---

_Este documento é vivo. Princípios entram por observação prática
de problema, não por importação de "boas práticas"._
