# Open issues

Achados que NÃO foram endereçados na spec onde apareceram (regra "mudanças
adjacentes vão pra outra spec" do `spec-guide.md`). Cada item tem candidato a
endereçamento explícito.

---

## #1 — PII e segredos no repositório

**Detectado em:** discovery / conceituação
**Arquivo(s):** `clientes.json`, `estado.json`, GitHub Actions

Nome e telefone dos clientes ficam versionados; chave Pix e token do Telegram
são segredos. Repo privado mitiga, mas não é criptografia.

**Impacto em produção:** médio — vazamento de PII/segredo se o repo escapar do escopo privado.

**Candidato a endereçamento:** `setup/00` mitiga (secrets em env, `clientes.json` no `.gitignore`); avaliar criptografia do estado numa spec futura de hardening se o volume crescer.

---

## #2 — Loop de trigger do commit de estado pelo Action

**Detectado em:** corte do Inc 1 (`cobranca/02`)
**Arquivo(s):** `.github/workflows/rodada.yml`

O Action commita `estado.json` de volta; sem cuidado, esse commit pode disparar
a própria rodada de novo.

**Impacto em produção:** médio — runs em loop / mensagens duplicadas.

**Candidato a endereçamento:** `cobranca/02` (filtrar o trigger pra cron-only, ou `[skip ci]` no commit de estado).

---

## #3 — Janela do `getUpdates` × cadência do cron

**Detectado em:** discovery
**Arquivo(s):** (futuro) `src/services/telegram/`

A leitura de respostas do Telegram (marcar "pago", Inc 2) usa `getUpdates`, cuja
janela é ~24h. Se o cron rodar com folga > 24h, respostas se perdem.

**Impacto em produção:** zero hoje (Inc 1 não lê respostas); médio a partir do Inc 2.

**Candidato a endereçamento:** Inc 2 (spec de leitura de respostas) — garantir cron ≥ 1x/dia.

---

## #4 — Fuso horário do cron (UTC)

**Detectado em:** corte do Inc 1 (`cobranca/02`)
**Arquivo(s):** `.github/workflows/rodada.yml`

GitHub Actions roda em UTC; o horário do lembrete precisa considerar BR (-03).

**Impacto em produção:** baixo — lembrete sai em horário inesperado.

**Candidato a endereçamento:** `cobranca/02` (ajustar a expressão cron).

---

## #5 — Markdown do Telegram quebra com caracteres crus

**Detectado em:** validação humana de `cobranca/02` (primeiro envio real ao Telegram)
**Arquivo(s):** `src/services/cobranca/whatsapp.ts`, `src/services/cobranca/resumo.ts`

O resumo usa `parse_mode: Markdown` e embute a URL do `wa.me` num link `[txt](url)`.
`encodeURIComponent` não escapa `( ) ! ' *`; o `)` cru de "(copia e cola)" encerrava a
URL no meio e o Telegram devolvia HTTP 400 ("can't find end of the entity"). Bug
**latente** porque o smoke check de envio era "pendente-humano" — exatamente o
risco do `lessons-learned` ("smoke check em código > pendente humano").

**Impacto em produção:** alto (era) — nenhuma rodada conseguia enviar.

**Candidato a endereçamento:** **resolvido** em `whatsapp.ts` (escapa `()!'*` na URL,
RFC 3986) + teste de regressão. **Resíduo aberto:** `nome`/`pix` ainda entram crus no
Markdown do `resumo.ts`; um nome com `_ * [ ` ` quebraria de novo. Candidato a uma spec
de hardening (escapar o texto do resumo ou migrar pra `MarkdownV2`/HTML).

---

*Cada item DEVE ter "Candidato a endereçamento" explícito — sem isso, vira lixo acumulado.*
