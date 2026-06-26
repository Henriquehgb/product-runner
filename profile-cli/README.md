# Perfil: CLI / script Node em loop

Use este perfil em projetos que:

- Rodam como **script Node terminal** (não servidor HTTP).
- Têm um **loop principal** (infinito ou periódico).
- Fazem I/O com **lib externa** (broker, AI API, queue, etc.) que precisa ser isolada.
- Persistem estado via **arquivos locais** (JSON) ou DB.
- Não têm UI — observability via logs + arquivos consumidos por
  ferramentas tipo OpenSearch/Kibana.

## Conteúdo

| Arquivo | Pra quê |
|---|---|
| [code-patterns](./code-patterns.md) | Estrutura de pastas, schemas Zod, port/adapter pra integrações, padrões de erro, persistência |
| [claude-md.extension](../CLAUDE.md) | Seções específicas pra CLI (comandos `npm run`, configuração `.env`, observability via arquivos) |

## Como combinar com `common/`

Use o CLI — ele copia `common/` + este perfil pra `docs/` e gera o
`CLAUDE.md` raiz (mescla template + extension, substitui `{...}`):

```bash
npx product-runner --name meu-projeto --profile cli --dir .
```

Equivalente manual, se preferir sem npm:

```bash
cp common/*.md     meu-projeto/docs/
cp profile-cli/*.md meu-projeto/docs/
cat common/claude-md.template.md profile-cli/claude-md.extension.md \
    > meu-projeto/CLAUDE.md
# Adapta valores entre {} pelos do projeto.
```

## Origem

Conteúdo extraído de:
- **tradeBot** (snapshot tradebot-202605, refactor 11 specs)

Adaptações feitas pra generalizar:
- `BrokerClient` virou termo genérico "ExternalAdapter" em alguns
  exemplos.
- `tradeBot`/`Binance` → `{ProjectName}` / `{ExternalSystem}` quando
  apropriado.
- Defaults específicos de trade (multipliers, etc.) foram trocados
  por placeholders.

## Anti-pattern: usar este perfil pra projeto SSR

Web SSR tem fronteira HTTP, request/response, UI. Estrutura aqui
não cobre. Use `profile-ssr/` no lugar.
