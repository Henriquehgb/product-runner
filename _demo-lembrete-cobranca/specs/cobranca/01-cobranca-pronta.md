# Cobrança — Cobrança pronta (seleção + Pix + mensagem)

## Contexto

Coração do Inc 1 (ver `funcional/como-funciona.ldoc.md`). Dado o estado
carregado (setup/00), o sistema precisa descobrir **quem cobrar hoje** e
montar, para cada um, a **cobrança pronta**: o Pix copia-e-cola (com valor) e
a mensagem de WhatsApp com o link `wa.me`. Tudo offline e determinístico —
nada é enviado ainda.

## Depende de

- `setup/00-bootstrap`

## Entrega

Um comando (`npm run preview`) imprime, para cada cliente elegível hoje:
nome, valor, vencimento, o **Pix copia-e-cola** e o **link `wa.me`** com a
mensagem pronta. Quem já foi lembrado no mês **não** aparece.

## Entities envolvidas

- `Elegivel` (derivado): `{ cliente: Cliente, competencia: string, vencimento: Date }`.
- `CobrancaPronta` (derivado): `{ elegivel: Elegivel, pixCopiaECola: string, mensagem: string, linkWhatsApp: string }`.
- Reusa `ClienteSchema`, `ConfigSchema`, `EstadoSchema` de `setup/00`.

## Mudanças por arquivo

- `src/services/cobranca/competencia.ts` — `competenciaAtual(hoje): string` → `YYYY-MM`.
- `src/services/cobranca/selecao.ts` — `selecionarElegiveis({ clientes, estado, hoje, diasAntecedencia }): Elegivel[]` (função **pura**).
- `src/services/cobranca/pix.ts` — `gerarPixCopiaECola({ chave, nome, cidade, valor }): string` (BR Code EMV-MPM) + `crc16(payload): string` (CCITT-FALSE).
- `src/services/cobranca/mensagem.ts` — `montarMensagem({ nome, mesExtenso, valor, vencimento, pix }): string` (template confirmado).
- `src/services/cobranca/whatsapp.ts` — `montarLinkWaMe(telefone, mensagem): string` (texto `encodeURIComponent`).
- `src/preview.ts` — orquestra: carrega estado → seleciona → monta cobranças → imprime.

## Regras de negócio

- **Janela inclusive:** elegível se `vencimento ≤ hoje + diasAntecedencia`
  (o próprio dia do vencimento conta). Confirmado no gate da doc-funcional.
- **Idempotência:** pula cliente com `Cobranca{competencia atual, status:"lembrado"}`.
- Só clientes `ativo: true`.
- `vencimento` = `diaVencimento` na competência atual (se já passou no mês, ainda assim entra como "vencendo/vencido" dentro da regra — clamp do dia ao último dia do mês quando necessário).
- Valor formatado pt-BR (`R$ 150,00`); `telefone` sem `+`/símbolos no `wa.me`.
- **Pix:** BR Code EMV com valor no campo 54 e CRC16 (campo 63) correto.

## Não-objetivos

- Não envia Telegram nem persiste `lembrado` (vem em `cobranca/02`).
- Não marca pago, não trata atrasados (Inc 2 / Inc 3).
- Não integra PSP — o Pix é estático/offline, sem confirmação automática.

## Critérios de aceite

- [ ] Com hoje=`2026-06-07`, `diasAntecedencia=3` e João (vence dia 10): `selecionarElegiveis` retorna João.
- [ ] Com João já `lembrado` em `2026-06`: retorna vazio (idempotência).
- [ ] Com vencimento = exatamente hoje+3: João entra (borda inclusive).
- [ ] `crc16` bate contra vetor conhecido do BR Code (teste unitário).
- [ ] O Pix copia-e-cola gerado é aceito por um app de banco / validador de Pix *(smoke check humano — exige app real)*.
- [ ] `montarMensagem` produz exatamente o template confirmado, com valor e data interpolados.
- [ ] `npm run preview` imprime a cobrança pronta do João.
- [ ] Aplicam-se M1, M2, M3.

## Notas pra implementação

- `selecao`, `pix`, `mensagem`, `whatsapp` são **puros** (sem `fs`/`console`) — testáveis direto.
- BR Code: EMV-MPM (IDs 00/26/52/53/54/58/59/60/62/63), CRC16-CCITT (init `0xFFFF`, poly `0x1021`). O "como" do CRC é parte da decisão — referência: layout do Pix (Banco Central / EMVCo).

## Decisões de implementação

(Preencher após implementação.)
