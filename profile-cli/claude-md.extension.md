# Extension CLAUDE.md — Perfil CLI

> **Este arquivo é uma extensão.** Mescla com `common/claude-md.template.md`
> ao criar `CLAUDE.md` raiz do projeto. Mantém só seções relevantes
> ao perfil CLI.

## Seções a adicionar/sobrescrever no template-base

### Stack (extensão)

Adicionar:
- **Broker / lib externa:** {ex: `@binance/connector`, `openai`, etc.} — abstraído via `BrokerClient` (port/adapter)
- **Config:** `dotenv` + `.env`
- **Persistência:** arquivos JSON locais (`actualState.json`, `history/`)
- **Observability:** arquivos JSON formato Kibana consumidos por OpenSearch local (ou similar)
- **Containerização:** Docker (`docker-compose.yml`) — opcional

### Arquitetura — Princípio central (CLI)

Lógica de domínio (cálculo, decisão, regras) é código TypeScript
puro, sem acoplamento com lib externa, file system ou env. Acesso
à lib externa via interface (port). Persistência via funções
dedicadas. Loop principal é casca fina que orquestra.

### Estrutura alvo (CLI)

```
{project}/
├── CLAUDE.md
├── index.ts                     ← entrypoint mínimo (loop fino)
├── docs/
├── specs/
├── domain/
│   ├── {externalAdapter}.ts     ← interface (port)
│   └── errors.ts                ← classes de erro de domínio
├── services/
│   ├── {dominio}/               ← lógica pura + schemas
│   ├── persistence/             ← load/save JSON, mappers
│   └── integrations/            ← adapters (implementações dos ports)
├── tests/
└── dist/                        ← outDir do tsc (gitignored)
```

### Comandos úteis (CLI)

```bash
npm install                       # deps
npm run start                     # compilar e rodar (loop infinito)
npm run start:reset               # apaga estado e recomeça do zero (se aplicável)
npm test                          # testes
npx tsc --noEmit                  # typecheck
docker compose up -d              # infra (OpenSearch local, etc.) — opcional
```

### Configuração (CLI)

| Arquivo | Conteúdo | Comitado? |
|---|---|---|
| `.env` | Segredos da lib externa (API keys, etc.) | ❌ NUNCA |
| `.env.example` | Mesmas chaves sem valor | ✅ |
| `global.json` ou similar | Defaults globais | ✅ |
| `actualState.json` | Estado runtime (auto-gerado) | ❌ |
| `history/*` | Logs estruturados | ❌ |

Hot-reload de configs (se aplicável): a cada N segundos no loop principal
(definir `configCacheTime`).

### Comportamento do loop após erro (CLI)

O loop principal **NÃO deve morrer silenciosamente**. Erros não
tratados disparam `console.error` + exit code != 0. Pattern:

```ts
runTradingLoop({ broker }).catch((error) => {
    console.error("FATAL: bot loop crashed", error);
    process.exit(1);
});
```

Loop interno tem `try/catch` por par/tarefa pra continuar processando
outros, mas erro de orquestração mata o processo.

### Observability (CLI)

Status quo recomendado:
- Logs estruturados em `history/*.json` formato Kibana (`_index`,
  `_source`, `_id`).
- OpenSearch local via Docker pra dashboards (ou similar).
- `console.log` apenas pra orquestração (logger estruturado entra
  em spec dedicada se necessário).
