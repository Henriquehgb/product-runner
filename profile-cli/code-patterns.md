# Code patterns

Padrões para schemas, tipos, services, broker abstrato,
erros e persistência neste projeto.

Este documento descreve o **alvo arquitetural**. O código atual
não está todo nesse formato — chegamos lá pelas specs em `specs/`.
Quando houver divergência entre este doc e o código, este doc
ganha; o código é o que está sendo refatorado.

---

## Estrutura de pastas (alvo)

```
tradeBotRefatoring/
├── CLAUDE.md
├── index.ts                     ← entrypoint mínimo (loop fino)
├── docs/                        ← este e outros docs de referência
├── specs/                       ← specs por domínio
├── domain/
│   ├── broker.ts                ← interface BrokerClient
│   └── errors.ts                ← TradeError e subclasses
├── services/
│   ├── waves/
│   │   ├── schema.ts            ← WavesHistorySchema, derivados
│   │   ├── waves-history.ts     ← classe / lógica de detecção
│   │   └── tendency.ts          ← cálculos de tendência
│   ├── trading/
│   │   ├── schema.ts            ← TradingDataSchema, BuyOrder, SellOrder
│   │   ├── limits.ts            ← recalculateLimits puro
│   │   ├── decisions.ts         ← canBuy / canSell
│   │   └── loop.ts              ← orquestração do loop
│   ├── persistence/
│   │   ├── schema.ts            ← BotStateSchema (root do estado)
│   │   ├── load.ts              ← reconstrução com schema
│   │   ├── save.ts              ← serialização
│   │   └── kibana.ts            ← mapper toKibana
│   └── integrations/
│       └── binance-broker.ts    ← adapter @binance/connector → BrokerClient
└── tests/                       ← Vitest (a partir de setup/01)
```

---

## Schemas e tipos

### Entity raiz

Cada domínio tem `schema.ts` com a entity Zod. Tipos derivam
sempre via `z.infer`.

```ts
// services/trading/schema.ts
import { z } from "zod";

export const TradingDataSchema = z.object({
    tradeSymbol: z.string(),
    totalToBuy: z.number().nonnegative(),
    sliceToBuy: z.number().positive(),
    currentSliceToBuy: z.number().positive(),
    buyOrdersWhithoutStack: z.number().int().nonnegative(),
    lastTurnDateTime: z.coerce.date().nullable(),
    lastMaxPrice: z.number().nullable(),
    lastMinPrice: z.number().nullable(),
    smallerBuyNotSelledPrice: z.number().nullable(),
    lastCheckedPrice: z.number().nullable(),
    maxLimitPriceToBuy: z.number().nullable(),
    maxLimitPriceToBuy_calc: z.string().nullable(),
    minLimitPriceToSell: z.number().nullable(),
    brokeUpFlowWaitingLimitPrice: z.number().nullable(),
    brokeDownFlowWaitingLimitPrice: z.number().nullable(),
});

export type TradingData = z.infer<typeof TradingDataSchema>;
```

### Regras

- Naming: `XxxSchema` pra Zod, `Xxx` pra type inferido.
- Nullable explícito (`.nullable()`), não `.optional()` por engano.
- Datas no JSON viram `string`; usar `z.coerce.date()` se quiser `Date` em runtime.
- Sem `interface` ou `type` paralelo ao schema.

### Derivações

```ts
// Input com subset + override
export const CreateBuyOrderInput = BuyOrderSchema.pick({ gotPrice: true, quantity: true, tradeSymbol: true }).extend({
    orderType: z.enum(["LIMIT_MAKER", "MARKET"]),
});

export type CreateBuyOrderInput = z.infer<typeof CreateBuyOrderInput>;

// Output sem campos internos
export const BuyOrderOutput = BuyOrderSchema.omit({ binanceOrderId: true }).extend({ ageMs: z.number() });
```

---

## Validação na fronteira

Toda entrada do mundo externo passa por `safeParse` ou `parse`
ANTES de chegar na lógica.

### Boot — leitura de config

```ts
// services/persistence/load.ts
import { GlobalConfigSchema } from "../trading/schema";

export function loadGlobalConfig(): GlobalConfig {
    const raw = JSON.parse(fs.readFileSync("global.json", "utf-8"));
    const result = GlobalConfigSchema.safeParse(raw);
    if (!result.success) {
        console.error("FATAL: global.json inválido", result.error.format());
        process.exit(1);
    }
    return result.data;
}
```

### Resposta de broker

```ts
const BinanceTickerResponseSchema = z.object({
    symbol: z.string(),
    price: z.string().regex(/^\d+(\.\d+)?$/),
});

// dentro do BinanceBroker:
const result = BinanceTickerResponseSchema.parse(response.data);
return { symbol: result.symbol, priceCents: toCents(result.price) };
```

### Reload de estado

Substituir `Object.setPrototypeOf` (vindo da spec 00) por
reconstrução validada (a partir de refactor/05):

```ts
// services/persistence/load.ts
export function loadBotState(): BotState | null {
    if (!fs.existsSync("actualTradeEnviroments.json")) return null;
    const raw = JSON.parse(fs.readFileSync("actualTradeEnviroments.json", "utf-8"));
    return BotStateSchema.parse(raw);
}
```

---

## Services

### Estrutura de um domínio

```
services/{domínio}/
├── schema.ts        ← entity + derivados
├── {lógica}.ts      ← funções puras
└── ...
```

### Regras

- Funções puras quando possível: input → output, sem side-effects.
- Side-effects (leitura, escrita, log) ficam em arquivos dedicados:
  `persistence/`, `integrations/`, ou em camada de orquestração.
- Services podem importar outros services do MESMO nível ou inferiores.
- Services NUNCA importam `@binance/connector`, `dotenv`, `fs`, `process`.
- Services NUNCA chamam `console.log`. Logs são responsabilidade
  do orquestrador (loop) ou de logger estruturado.

### Exemplo: lógica pura

```ts
// services/trading/limits.ts

export function recalculateLimits(input: {
    actualPrice: number;
    waves: WavesSnapshot;
    quantityOfBuyOrdersNotSelled: number;
    config: ConfigValues;
    trade: TradingData;
}): RecalculatedLimits {
    // ...lógica determinística, sem ed.log, sem process, sem fs
    return {
        maxLimitPriceToBuy,
        minLimitPriceToSell,
        brokeUpFlowWaitingLimitPrice,
        brokeDownFlowWaitingLimitPrice,
        maxLimitPriceToBuy_calc,
    };
}
```

Função pura é alvo direto de teste unitário: alimentar inputs,
verificar outputs.

---

## BrokerClient (port)

Interface no domínio. Implementação em `services/integrations/`.

```ts
// domain/broker.ts
export interface BrokerClient {
    getTickerPrice(symbol: string): Promise<{ symbol: string; price: number }>;
    placeOrder(input: PlaceOrderInput): Promise<PlacedOrder>;
    getAccountState(): Promise<AccountState>;
}
```

```ts
// services/integrations/binance-broker.ts
import { Spot } from "@binance/connector";

export class BinanceBroker implements BrokerClient {
    constructor(
        private apiKey: string,
        private apiSecret: string
    ) {
        this.client = new Spot(apiKey, apiSecret);
    }
    async getTickerPrice(symbol: string) {
        const { data } = await this.client.tickerPrice(symbol);
        const parsed = BinanceTickerResponseSchema.parse(data);
        return { symbol: parsed.symbol, price: Number(parsed.price) };
    }
    // ...
}
```

### Por quê

- Lógica de trade testável com mock de broker (`InMemoryBroker`).
- Trocar Binance por outra exchange é trocar 1 arquivo.
- Validação da resposta vive no adapter, não espalhada.

---

## Erros de domínio

Lógica nunca lança `Error` puro. Usa classe específica.

```ts
// domain/errors.ts
export class TradeError extends Error {
    constructor(
        message: string,
        public code: string
    ) {
        super(message);
        this.name = "TradeError";
    }
}

export class SafeLimitError extends TradeError {
    constructor(message: string) {
        super(message, "SAFE_LIMIT_VIOLATED");
    }
}

export class BrokerError extends TradeError {
    constructor(
        message: string,
        public binanceMsg?: string
    ) {
        super(message, "BROKER_ERROR");
    }
}

export class InvalidConfigError extends TradeError {
    constructor(message: string) {
        super(message, "INVALID_CONFIG");
    }
}
```

### Regras

- Mensagens em pt-BR (consistente com logs existentes).
- `code` em SCREAMING_SNAKE_CASE.
- Stack trace preservado: `throw error` ou `throw new XxxError(msg, error)` nunca `throw error.message`.

---

## Mapper toKibana

Centralizado em `services/persistence/kibana.ts`.

```ts
export function toKibana<T>(record: T, id: string, index = "tradebot"): KibanaRecord<T> {
    return {
        _index: index,
        _type: "_doc",
        _id: id,
        _score: 1,
        _source: record,
    };
}

export function toKibanaJsonl<T>(records: Array<{ data: T; id: string }>): string {
    return records.map(({ data, id }) => JSON.stringify(toKibana(data, id))).join("\n") + "\n";
}
```

Substitui o `formatDocumentToKibana` espalhado no `index.ts` atual.

---

## Persistência

### Save

```ts
// services/persistence/save.ts
export function saveBotState(state: BotState) {
    const validated = BotStateSchema.parse(state);
    fs.writeFileSync("actualTradeEnviroments.json", JSON.stringify(validated), "utf-8");
}
```

Validação em save protege contra escrever estado corrompido
(útil na transição da spec 00 pra 05).

### Load

Já mostrado em "Validação na fronteira > Reload de estado".

### Substituição do `Object.setPrototypeOf`

Spec 00 deixou `Object.setPrototypeOf(item, BotEnviromentData.prototype)`
como solução temporária. Quando schemas Zod existirem (setup/02),
refactor/05 substitui por:

```ts
const state = BotStateSchema.parse(raw);
// state já é tipado, sem precisar reanexar prototype manualmente
```

Classes podem virar funções/objetos puros, ou continuar como classes
com método estático `from(plain): T` que invoca o construtor.
Decisão fica pra refactor/05.

---

## Convenções de naming

| Item                        | Padrão                     | Exemplo                                 |
| --------------------------- | -------------------------- | --------------------------------------- |
| Schema Zod                  | `XxxSchema`                | `TradingDataSchema`                     |
| Type inferido               | `Xxx`                      | `TradingData`                           |
| Funções                     | `camelCase` verbo + objeto | `recalculateLimits`, `loadBotState`     |
| Classes (quando inevitável) | `PascalCase` substantivo   | `BinanceBroker`, `WavesHistory`         |
| Arquivos                    | `kebab-case.ts`            | `binance-broker.ts`, `waves-history.ts` |
| Constantes                  | `SCREAMING_SNAKE_CASE`     | `DEFAULT_TIMER_MS`                      |
| Erro                        | `XxxError`                 | `SafeLimitError`                        |
| Test files                  | `xxx.test.ts`              | `waves-history.test.ts`                 |

Exceção: arquivos do código atual (`BotEnviromentData.ts`, etc.) ficam
como estão até serem refatorados em suas specs respectivas. Nada de
renomeação fora do escopo da spec corrente.
