# Lembrete de Cobrança Mensal

App do Incremento 1. Descobre quem vence, monta o **Pix copia-e-cola** + a
**mensagem**, e **cobra direto no Telegram de cada cliente** — sem PSP, sem API
paga do WhatsApp. (O envio por WhatsApp fica pra um incremento futuro; o link
`wa.me` segue disponível como fallback no `preview`.)

Implementa as specs em `../specs/` (estágio 4 do pipeline).

## ⚠️ Como o Telegram endereça o cliente (leia antes)

O bot **não** manda mensagem por número de telefone. Ele só consegue falar com
quem **deu `/start` no bot** antes, e o endereço é o **`chat_id`** (um número),
não o telefone. Então, por cliente:

1. O cliente (ex.: Bruno) abre o seu bot e manda **`/start`** (ou qualquer msg).
2. Você roda `npm run telegram:chats` e copia o **`chat_id`** que aparece com o nome dele.
3. Põe esse `chat_id` no `clientes.json`, no campo **`telegramChatId`**.

Cliente sem `telegramChatId` é **pulado** na rodada (e listado no recap) — nunca
é cobrado às cegas.

## Rodar

```bash
npm install
cp clientes.example.json clientes.json   # edite com seus clientes

export PIX_KEY="sua-chave@pix"
export RECEBEDOR_NOME="Seu Nome"
export RECEBEDOR_CIDADE="SUA CIDADE"
export TELEGRAM_BOT_TOKEN="..."           # via @BotFather
export TELEGRAM_CHAT_ID="..."             # SEU chat (recebe o recap da rodada)
export DIAS_ANTECEDENCIA="3"

npm run dev             # valida config + clientes (smoke)
npm run telegram:chats  # lista os chat_id de quem deu /start no bot
npm run preview         # imprime as cobranças prontas de hoje (não envia)
npm run rodada          # ENVIA a cobrança no Telegram de cada cliente e marca lembrado
npm test                # 21 testes
```

Na rodada: cada cliente elegível recebe a cobrança no Telegram dele; você recebe
um **recap** no seu chat (`TELEGRAM_CHAT_ID`) com quem foi cobrado, quem foi
pulado (sem `telegramChatId`) e quem falhou.

## Agendamento

Copie `github-workflow.rodada.yml` para `.github/workflows/rodada.yml` no seu
repositório (privado) e cadastre os valores acima como **GitHub Secrets**. O
cron roda diário; o estado (`estado.json`) é commitado de volta com `[skip ci]`.

## Estrutura

```
src/
├── schema.ts                    Zod (fonte da verdade) + tipos
├── config.ts · clientes.ts · estado.ts   IO validado na fronteira (fail-fast)
├── index.ts · preview.ts · rodada.ts · telegram-chats.ts   entrypoints
└── services/
    ├── cobranca/  competencia · selecao · pix · mensagem · whatsapp · resumo(recap) · marcar
    └── telegram/  send · updates
```

Lógica de negócio é pura e testável; IO (fs/rede) fica isolado. A rodada envia
**por cliente** e marca lembrado **só quem recebeu** — falha num cliente não
impede os outros nem o marca (retenta na próxima).

## Escopo

Inc 1 **avisa e cobra** (direto no Telegram do cliente). Marcar "pago" (Inc 2),
ciclo automático e atrasados (Inc 3), e o canal WhatsApp ainda não estão aqui —
ver `../specs/_overview.md`.
