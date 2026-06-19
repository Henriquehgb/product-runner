# Cobrança — Rodada agendada + resumo no Telegram

## Contexto

Fecha o Inc 1: transforma a "cobrança pronta" (cobranca/01) numa **rodada
automática** que roda no horário, te entrega o resumo no Telegram com os links
prontos, e registra que o cliente foi lembrado (idempotência persistida). É o
ponto em que o sistema deixa de imprimir no terminal e passa a te cutucar
sozinho.

## Depende de

- `cobranca/01-cobranca-pronta`

## Entrega

No horário agendado (GitHub Actions), a rodada roda: seleciona elegíveis, monta
as cobranças, **envia um resumo no Telegram** com nome/valor/link `wa.me`/Pix de
cada um, marca cada cobrança como `lembrado` + `dataLembrete`, e **persiste o
estado** (commit de volta no repo). Rodar de novo no mesmo dia **não** reenvia.

## Entities envolvidas

- Reusa `Elegivel`/`CobrancaPronta` (cobranca/01) e `EstadoSchema` (setup/00).
- `ResumoTelegram` (derivado): texto Markdown com 1 bloco por `CobrancaPronta`.

## Mudanças por arquivo

- `src/services/telegram/send.ts` — `enviarResumo(token, chatId, texto): Promise<void>` (Bot API `sendMessage`, `parse_mode: Markdown`, valida resposta com Zod).
- `src/services/cobranca/resumo.ts` — `montarResumo(cobrancas): string` (puro).
- `src/services/cobranca/marcar.ts` — `marcarLembrados(estado, elegiveis, hoje): Estado` (puro; cria/atualiza `Cobranca` com `status:"lembrado"`, `dataLembrete`).
- `src/rodada.ts` — orquestração: carrega → seleciona → monta → envia → marca → `saveEstado`. Se não há elegíveis, **não** envia nada.
- `.github/workflows/rodada.yml` — cron diário (ajustar UTC→BR), roda `npm run rodada` com secrets, e **commita** `estado.json` atualizado de volta.

## Regras de negócio

- **Idempotência persistida:** `marcarLembrados` grava antes do próximo run; quem está `lembrado` na competência é pulado por `cobranca/01`.
- Sem elegíveis → nenhuma mensagem enviada (silêncio é correto).
- Secrets (`PIX_KEY`, `TELEGRAM_BOT_TOKEN`, etc.) vêm de GitHub Secrets, nunca do repo.
- Cron em UTC: configurar o horário considerando o fuso BR (-03).
- Falha no envio do Telegram → **não** marcar como lembrado (senão perde o aviso); erro claro e exit ≠ 0.

## Não-objetivos

- Não **lê** respostas do Telegram nem marca "pago" — isso é o Inc 2 (`getUpdates`/CU5/CU6).
- Não gera a cobrança do próximo mês automaticamente nem trata atrasados — Inc 3 (CU7/CU8).
- Não usa servidor sempre-ligado: o job é curto e stateless além do `estado.json`.

## Critérios de aceite

- [ ] `npm run rodada` com João elegível envia 1 mensagem ao Telegram configurado.
- [ ] Após a rodada, `estado.json` tem `Cobranca{joão, "2026-06", "lembrado", dataLembrete}`.
- [ ] Rodar `npm run rodada` de novo no mesmo dia **não** envia mensagem do João.
- [ ] Sem nenhum elegível, a rodada termina sem enviar nada e sai 0.
- [ ] Falha simulada no `sendMessage` → João **não** é marcado lembrado; processo sai ≠ 0.
- [ ] O workflow `rodada.yml` dispara no cron e commita o estado *(smoke check humano — exige o Action rodando)*.
- [ ] Aplicam-se M1, M2, M3.

## Notas pra implementação

- `send.ts` é o único com IO de rede; `resumo`/`marcar` são puros e testáveis.
- O commit do estado pelo Action usa um token com permissão de escrita; cuidar de loop de trigger (o commit não deve disparar a própria rodada).
- Ordem sugerida: `resumo` → `marcar` → `send` → `rodada` → workflow.

## Decisões de implementação

**Status: ✅** (2 critérios pendente-humano) — 16/16 testes; `tsc --noEmit` limpo.

- **Núcleo testável `executarRodada` com `enviar` injetável.** Separei a orquestração pura
  (recebe a função de envio) do wrapper de IO (`main`). Isso permite testar a ordem
  **envia-antes-de-marca** sem rede: teste com sender que lança confirma que o estado fica
  intacto (ninguém marcado). Alternativa descartada: mockar `fetch` global (mais frágil).
- **Guarda `import.meta.url === file://argv[1]`** no `rodada.ts` pra não disparar IO ao
  ser importado nos testes (lição do `spec-guide` sobre side-effects no top-level).
- **Workflow fora de `.github/`** (`github-workflow.rodada.yml`): de propósito, pra **não
  disparar** no repo de templates. Traz `permissions: contents:write`, `[skip ci]` no commit
  de estado (evita loop — open-issue #2) e cron em UTC com nota de fuso (#4).
- **Falha de envio não marca lembrado:** `await enviar(...)` antes de `marcarLembrados`;
  se lançar, `saveEstado` nunca roda. Coberto por teste.
- **⚠️ Pendente-humano:** o envio real ao Telegram e o disparo do Action no cron exigem
  bot/secrets/Actions reais — não validável neste ambiente. A lógica está coberta por testes.
- **Instalei `@types/node`** (não estava no bootstrap) pra o `tsc --noEmit` passar — achado
  adjacente, anotado; o runtime via `tsx`/`vitest` já funcionava sem ele.
- **[validação humana 2026-06-19] Bug latente no envio real.** O primeiro `npm run rodada`
  de verdade falhou (Telegram HTTP 400): a URL do `wa.me` no markdown link tinha `( )` crus
  (`encodeURIComponent` não escapa `()!'*`) e o parser encerrava a URL no `)` de
  "(copia e cola)". Corrigido em `whatsapp.ts` (escapa esses chars) + teste de regressão
  (17/17). O critério "envia 1 mensagem ao Telegram" estava ✅ na lógica mas ❌ no envio
  real — confirma a lição "smoke check em código > pendente-humano". Resíduo (escape de
  `nome`/`pix` no resumo) anotado em `_open-issues.md#5`.
