# Como funciona — Lembrete de Cobrança Mensal (Inc 1)

> Documentação funcional (LDoc), fonte da verdade. Descreve **o que o sistema é
> e como usá-lo**, em tom presente. O `como-funciona.hdoc.md` é derivado deste.
> Cobre os **Incrementos 1–2** (lembrete com 1 clique + controle de pago/devendo).

## O que é

Um robô que cuida do lembrete de cobrança da sua mensalidade. Todo dia ele
verifica quais clientes estão para vencer e te entrega, no Telegram, um resumo
**com a cobrança já pronta**: o valor, o **Pix copia-e-cola** (com o valor
embutido) e um **link do WhatsApp** com a mensagem escrita. Você só abre, confere
e envia com um clique. Você não monta mensagem nem gera Pix na mão.

Além de avisar e preparar a cobrança, o sistema **fecha o ciclo**: quando um
cliente paga, você marca respondendo no Telegram (`pago João`), e o resumo passa
a mostrar **quem já pagou e quem ainda falta** no mês.

## Como funciona

O sistema tem quatro partes:

- **Lista de clientes (`clientes.json`)** — onde ficam seus clientes: nome,
  telefone, valor mensal, dia de vencimento e se está ativo.
- **Configuração** — sua **chave Pix**, seu **nome e cidade** (que o Pix exige),
  os dados do **bot do Telegram** e quantos **dias de antecedência** você quer ser
  avisado. Os segredos (chave Pix, token do bot) ficam em *secrets*, não no arquivo.
- **A rodada diária** — roda sozinha num horário (no GitHub Actions). Primeiro
  ela **lê as suas respostas no Telegram** e registra os pagamentos que você
  marcou; depois descobre quem vence dentro da janela de antecedência e **ainda
  não foi avisado neste mês**, e para cada um gera o Pix copia-e-cola e o link
  do WhatsApp.
- **O resumo no Telegram** — a mensagem que chega pra você. Traz cada cliente a
  cobrar (nome, valor, link do WhatsApp e Pix) e o **resumo do ciclo**: todos os
  clientes do mês com ✅ pago ou ⏳ devendo.

O sistema lembra quem já foi avisado no mês. Se a rodada rodar de novo no mesmo
dia, **o mesmo cliente não aparece duas vezes**.

Para marcar um pagamento, você **responde no Telegram** com `pago` e o nome do
cliente. Na rodada seguinte o robô reconhece a resposta, marca o cliente como
**pago** (guardando a data) e ele sai da lista de quem deve.

## Como usar

### 1. Cadastrar um cliente

Adicione o cliente no `clientes.json`:

```json
{
  "nome": "João Silva",
  "telefone": "+5511999990000",
  "valorMensal": 150.00,
  "diaVencimento": 10,
  "ativo": true
}
```

- `telefone` no formato internacional (`+55` + DDD + número) — é o que abre o WhatsApp.
- `diaVencimento` é o dia do mês (1 a 31).
- `ativo: false` desliga o cliente sem precisar apagá-lo.

### 2. Configurar uma vez

Defina os valores de configuração (como *secrets* do repositório):

- `PIX_KEY` — sua chave Pix (e-mail, telefone, CPF/CNPJ ou aleatória).
- `RECEBEDOR_NOME` e `RECEBEDOR_CIDADE` — vão no Pix (ex.: "Maria Prestadora", "SAO PAULO").
- `TELEGRAM_BOT_TOKEN` — o token do seu bot (criado no @BotFather).
- `TELEGRAM_CHAT_ID` — o id do seu chat (pra onde o resumo é enviado).
- `DIAS_ANTECEDENCIA` — quantos dias antes do vencimento avisar (ex.: 3).

### 3. O que acontece todo dia

No horário agendado, a rodada roda. Se algum cliente vence dentro da janela de
antecedência, chega no seu Telegram um resumo como este:

> 💰 **Vencendo em 3 dias (10/06)**
> **João Silva — R$ 150,00**
> 📲 [Enviar no WhatsApp](https://wa.me/5511999990000?text=...)
> 🔑 Pix copia-e-cola: `00020126...` *(já com R$ 150,00)*

Se ninguém vence na janela, nenhuma mensagem é enviada.

### 4. Enviar o lembrete (1 clique)

Toque no link **Enviar no WhatsApp**. A conversa com o cliente abre com a
mensagem **já escrita**, por exemplo:

> Olá, João! Passando pra lembrar da mensalidade de junho, no valor de
> **R$ 150,00**, com vencimento em **10/06**. Você pode pagar via Pix
> (copia e cola): `00020126...`. Qualquer dúvida, é só chamar. Obrigado!

Confira e envie. O cliente copia o Pix da própria mensagem e paga.

### 5. Marcar quem pagou

Quando o cliente te paga, **responda no Telegram** com `pago` seguido do nome:

> pago João

Na próxima rodada o robô reconhece, marca o João como **pago** (com a data) e
ele sai da lista de quem deve. Se houver dois clientes com o mesmo nome, o robô
responde pedindo pra você especificar — responda de novo com o nome completo e
ele resolve na rodada seguinte.

### 6. Acompanhar o ciclo

A cada rodada chega também um resumo do mês inteiro, com quem já pagou e quem
ainda falta:

> 📊 **Ciclo 06/2026**
> ✅ **João Silva** — R$ 150,00 *(pago 19/06)*
> ⏳ **Maria Souza** — R$ 200,00 *(devendo)*

### Exemplo ponta a ponta

Hoje é **07/06**, antecedência configurada em **3 dias**. O João vence dia **10**
e custa **R$ 150,00**. Na rodada de hoje, o João entra na janela (vence até 10/06)
e ainda não foi avisado em junho. Você recebe o resumo acima, toca no link, e a
mensagem de cobrança do João sai pelo WhatsApp com o Pix de R$ 150,00 pronto.
Amanhã, se a rodada rodar de novo, o João **não** reaparece — já foi avisado.

No dia seguinte o João te paga e você responde no Telegram **`pago João`**. Na
rodada seguinte o robô lê a resposta, marca o João como pago (19/06) e o resumo
do ciclo passa a mostrar **João ✅ R$ 150,00 (pago)** e, se a Maria (R$ 200,00)
ainda não pagou, **Maria ⏳ devendo**.
