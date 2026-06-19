# Como funciona — Lembrete de Cobrança Mensal

> Guia de uso. Derivado de `como-funciona.ldoc.md` — não editar à mão.

## O que é

Um robô que cuida do lembrete da sua mensalidade. Todo dia ele olha quais
clientes estão para vencer e te manda no Telegram um resumo com a cobrança
**já pronta**: o valor, o **Pix copia-e-cola** e um **link do WhatsApp** com a
mensagem escrita. Você abre, confere e envia com um clique — sem montar mensagem
nem gerar Pix na mão.

## As partes

- **Sua lista de clientes** — nome, telefone, valor mensal e dia de vencimento.
- **Sua configuração** — chave Pix, nome e cidade (que o Pix pede), o bot do
  Telegram e quantos dias antes você quer ser avisado.
- **A rodada diária** — roda sozinha e descobre quem está vencendo.
- **O resumo no Telegram** — chega pra você com cada cliente a cobrar.

Quem já foi avisado no mês não aparece de novo.

## Passo a passo

**1. Cadastre um cliente** na sua lista:

```json
{
  "nome": "João Silva",
  "telefone": "+5511999990000",
  "valorMensal": 150.00,
  "diaVencimento": 10,
  "ativo": true
}
```

O telefone vai no formato `+55` + DDD + número. `ativo: false` desliga o cliente
sem apagá-lo.

**2. Configure uma vez:** sua chave Pix, seu nome e cidade, o bot do Telegram e
os dias de antecedência (ex.: avisar 3 dias antes).

**3. Receba o aviso.** No horário, se alguém vence dentro da janela, chega:

> 💰 **Vencendo em 3 dias (10/06)**
> **João Silva — R$ 150,00**
> 📲 Enviar no WhatsApp · 🔑 Pix copia-e-cola: `00020126...`

**4. Envie com 1 clique.** Toque em **Enviar no WhatsApp**: a conversa abre com a
mensagem pronta —

> Olá, João! Passando pra lembrar da mensalidade de junho, no valor de
> **R$ 150,00**, com vencimento em **10/06**. Você pode pagar via Pix
> (copia e cola): `00020126...`. Qualquer dúvida, é só chamar. Obrigado!

Confira e envie. O cliente copia o Pix da mensagem e paga.

## Um exemplo

Hoje é 07/06 e você avisa com 3 dias de antecedência. O João vence dia 10 e custa
R$ 150,00. A rodada de hoje coloca o João no resumo; você toca no link e a
cobrança sai com o Pix de R$ 150,00 pronto. Amanhã ele não reaparece — já foi
avisado.
