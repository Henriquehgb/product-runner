# Setup — Bootstrap do projeto

## Contexto

Primeiro tijolo do "Lembrete de Cobrança Mensal" (Inc 1 — ver
`reqs/ldoc.md`). Antes de qualquer lógica de cobrança, o projeto precisa de
base TypeScript, validação de dados na fronteira (Zod) e o carregamento
validado da lista de clientes e da configuração. Sem isso, qualquer spec
seguinte trabalha sobre dado não-confiável.

## Depende de

- (nenhuma — é a fundação)

## Entrega

Rodando `npm run dev`, o sistema **carrega e valida** `clientes.json` + a
configuração (de variáveis de ambiente), e imprime quantos clientes ativos há.
Dado inválido → **fail-fast** com mensagem clara e exit ≠ 0. Projeto com
Prettier e Vitest prontos.

## Entities envolvidas

Schemas Zod (fonte da verdade; tipos via `z.infer` — ver `code-patterns.md`):

- `ClienteSchema` — `nome: string`, `telefone: string` (regex E.164 `^\+\d{12,13}$`),
  `valorMensal: number().positive()`, `diaVencimento: number().int().min(1).max(31)`,
  `ativo: boolean`.
- `ConfigSchema` — `chavePix`, `nomeRecebedor`, `cidadeRecebedor`,
  `telegramBotToken`, `telegramChatId`, `diasAntecedencia: number().int().min(0)`.
  Lida de env (secrets), **não** do JSON versionado.
- `EstadoSchema` — `cobrancas: Cobranca[]`, onde
  `Cobranca = { clienteId: string, competencia: string /YYYY-MM/, status: enum["pendente","lembrado"], dataLembrete: string|null }`.

## Mudanças por arquivo

- `package.json` / `tsconfig.json` — TS estrito, `zod`, scripts `dev`, `test`, `format`.
- `.prettierrc` + `lint-staged` + hook de pre-commit (kickoff etapa 5).
- `vitest.config.ts` — harness de teste vazio rodando.
- `src/schema.ts` — os três schemas acima.
- `src/config.ts` — `loadConfig()`: lê env, `ConfigSchema.parse`, fail-fast.
- `src/clientes.ts` — `loadClientes()`: lê `clientes.json`, `ClienteSchema.array().parse`, fail-fast.
- `src/estado.ts` — `loadEstado()`/`saveEstado()` com `EstadoSchema` (cria vazio se ausente).
- `src/index.ts` — entrypoint: carrega tudo e imprime `N clientes ativos`.
- `clientes.example.json` — exemplo (João Silva). `clientes.json` no `.gitignore` se contiver PII real.

## Regras de negócio

- Validação **na fronteira**: todo dado externo passa por Zod antes da lógica.
- `clientes.json` ausente ou malformado → erro claro, exit 1.
- Config faltando qualquer campo → erro nomeando o campo, exit 1.
- Segredos (chave Pix, token Telegram) **só** via env/secrets, nunca no JSON.

## Não-objetivos

- Não seleciona quem vence (vem em `cobranca/01`).
- Não gera Pix nem mensagem (vem em `cobranca/01`).
- Não envia Telegram nem amarra GitHub Actions (vem em `cobranca/02`).
- Não marca pago (Inc 2).

## Critérios de aceite

- [ ] `npm run dev` com `clientes.example.json` + env válidos imprime a contagem de clientes ativos e sai 0.
- [ ] Remover um campo obrigatório da config → processo sai com código ≠ 0 e mensagem citando o campo.
- [ ] `clientes.json` com `valorMensal` negativo → falha de validação clara.
- [ ] `npm test` roda (mesmo que com 0/1 teste) e `npm run format` aplica Prettier.
- [ ] Aplicam-se os critérios meta M1, M2, M3.

## Notas pra implementação

- Seguir `docs/code-patterns.md`: `XxxSchema`/`Xxx`, `kebab-case.ts`, nullable explícito.
- Funções de IO (`fs`) isoladas em `config.ts`/`clientes.ts`/`estado.ts`; resto puro.

## Decisões de implementação

**Status: ✅** — todos os critérios passam (`npm run dev` exit 0 com config válida;
exit 1 citando o campo faltante; `valorMensal` negativo barrado; `npm test` 2/2;
`npm run format` aplica Prettier).

- **`clienteId` = telefone.** O DER não definia chave; usei o `telefone` (E.164) como
  id estável do cliente, por ser único e já presente. Decisão minha — registrada para o
  gerador/review reconciliarem se um id dedicado for preferível.
- **`tsx` em vez de build.** Roda TS direto (sem etapa de compilação) — simplicidade
  para um worker pequeno. Alternativa descartada: `tsc` + `node dist`.
- **`CLIENTES_PATH`/`ESTADO_PATH` via env.** Para testabilidade (apontar a fixtures);
  default `clientes.json`/`estado.json`.
- **Limites de tamanho no schema da Config** (`nomeRecebedor ≤ 25`, `cidadeRecebedor ≤ 15`):
  antecipam os limites dos campos 59/60 do BR Code (usados em `cobranca/01`). Adicionado aqui
  por morar no schema; não altera o escopo da spec.
- **Tentação não executada:** não implementei seleção/Pix/Telegram (são specs seguintes).
