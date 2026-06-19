# Lembrete de Cobrança Mensal

App do Incremento 1 ("Lembrete com 1 clique"). Descobre quem vence, monta o
**Pix copia-e-cola** + a **mensagem** + o **link `wa.me`**, e te entrega no
**Telegram** pra enviar com 1 clique. Sem PSP, sem API paga do WhatsApp.

Implementa as specs em `../specs/` (estágio 4 do pipeline).

## Rodar

```bash
npm install
cp clientes.example.json clientes.json   # edite com seus clientes

export PIX_KEY="sua-chave@pix"
export RECEBEDOR_NOME="Seu Nome"
export RECEBEDOR_CIDADE="SUA CIDADE"
export TELEGRAM_BOT_TOKEN="..."           # via @BotFather
export TELEGRAM_CHAT_ID="..."
export DIAS_ANTECEDENCIA="3"

npm run dev       # valida config + clientes (smoke)
npm run preview   # imprime as cobranças prontas de hoje (não envia)
npm run rodada    # envia o resumo no Telegram e marca lembrado
npm test          # 16 testes
```

## Agendamento

Copie `github-workflow.rodada.yml` para `.github/workflows/rodada.yml` no seu
repositório (privado) e cadastre os valores acima como **GitHub Secrets**. O
cron roda diário; o estado (`estado.json`) é commitado de volta com `[skip ci]`.

## Estrutura

```
src/
├── schema.ts                    Zod (fonte da verdade) + tipos
├── config.ts · clientes.ts · estado.ts   IO validado na fronteira (fail-fast)
├── index.ts · preview.ts · rodada.ts      entrypoints
└── services/
    ├── cobranca/  competencia · selecao · pix · mensagem · whatsapp · resumo · marcar
    └── telegram/  send
```

Lógica de negócio é pura e testável; IO (fs/rede) fica isolado.

## Escopo

Inc 1 **avisa e prepara**. Marcar "pago" (Inc 2), ciclo automático e atrasados
(Inc 3) ainda não estão aqui — ver `../specs/_overview.md`.
