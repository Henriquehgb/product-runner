import { listarChats } from "./services/telegram/updates.js";

/**
 * Descobre os chat_id de quem já falou com o bot, pra você cadastrar em
 * `telegramChatId` no clientes.json. Usa só TELEGRAM_BOT_TOKEN (sem o resto da
 * config), pra rodar mesmo antes de configurar Pix/recebedor.
 *
 * Passo a passo: peça ao cliente (ex.: Bruno) abrir o bot e mandar /start,
 * depois rode `npm run telegram:chats` e copie o id que aparecer com o nome dele.
 */
async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("FATAL: defina TELEGRAM_BOT_TOKEN (o token do @BotFather).");
    process.exit(1);
  }

  const chats = await listarChats(token);
  if (chats.length === 0) {
    console.log("Nenhuma conversa encontrada.");
    console.log("Peça pro cliente abrir o bot e mandar /start, depois rode de novo.");
    console.log("(getUpdates só mostra mensagens recentes — costuma reter ~24h.)");
    return;
  }

  console.log("Chats conhecidos pelo bot (use o id como telegramChatId no clientes.json):\n");
  for (const c of chats) {
    console.log(`  ${c.id}\t${c.nome}\t(${c.tipo})`);
  }
}

main().catch((e) => {
  console.error(`FATAL: ${(e as Error).message}`);
  process.exit(1);
});
