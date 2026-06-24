<!--
Extensão do CLAUDE.md — Perfil CLI.
Este arquivo NÃO é concatenado: cada bloco abaixo declara, via diretiva
`pdb-merge`, como dobra numa seção do template-base (common/claude-md.template.md).
Modos: replace (troca a seção), append (acrescenta ao fim da seção),
after (insere logo após a seção). Edite o conteúdo, não as diretivas.
-->

<!-- pdb-merge: append section="Stack" -->

- **Broker / lib externa:** {ex: `@binance/connector`, `openai`, etc.} —
  abstraído via `BrokerClient` (port/adapter)
- **Config:** `dotenv` + `.env`
- **Persistência:** arquivos JSON locais (`actualState.json`, `history/`)
- **Observability:** arquivos JSON formato Kibana consumidos por OpenSearch
  local (ou similar)
- **Containerização:** Docker (`docker-compose.yml`) — opcional

<!-- pdb-merge: replace section="Princípio central" -->

### Princípio central

Lógica de domínio (cálculo, decisão, regras) é código TypeScript
puro, sem acoplamento com lib externa, file system ou env. Acesso
à lib externa via interface (port). Persistência via funções
dedicadas. Loop principal é casca fina que orquestra.

<!-- pdb-merge: replace section="Estrutura de pastas" -->

### Estrutura de pastas

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

<!-- pdb-merge: replace section="Comandos úteis" -->

## Comandos úteis

```bash
npm install                       # deps
npm run start                     # compilar e rodar (loop infinito)
npm run start:reset               # apaga estado e recomeça do zero (se aplicável)
npm test                          # testes
npx tsc --noEmit                  # typecheck
docker compose up -d              # infra (OpenSearch local, etc.) — opcional
```

<!-- pdb-merge: replace section="Configuração" -->

## Configuração

| Arquivo                  | Conteúdo                                  | Comitado? |
| ------------------------ | ----------------------------------------- | --------- |
| `.env`                   | Segredos da lib externa (API keys, etc.)  | ❌ NUNCA  |
| `.env.example`           | Mesmas chaves sem valor                   | ✅        |
| `global.json` ou similar | Defaults globais                          | ✅        |
| `actualState.json`       | Estado runtime (auto-gerado)              | ❌        |
| `history/*`              | Logs estruturados                         | ❌        |

Hot-reload de configs (se aplicável): a cada N segundos no loop principal
(definir `configCacheTime`).

<!-- pdb-merge: append section="Convenções de código" -->

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
