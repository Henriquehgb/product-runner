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

(Preencher após implementação.)
