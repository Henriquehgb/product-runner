import { ConfigSchema, type Config } from "./schema.js";

/**
 * Carrega a config a partir de variáveis de ambiente (secrets).
 * Fail-fast: env inválida/ausente encerra o processo com mensagem clara.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const raw = {
    chavePix: env.PIX_KEY,
    nomeRecebedor: env.RECEBEDOR_NOME,
    cidadeRecebedor: env.RECEBEDOR_CIDADE,
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramChatId: env.TELEGRAM_CHAT_ID,
    diasAntecedencia:
      env.DIAS_ANTECEDENCIA === undefined ? undefined : Number(env.DIAS_ANTECEDENCIA),
  };

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    const campos = result.error.issues.map((i) => i.path.join(".") || "(raiz)").join(", ");
    console.error(`FATAL: configuração inválida nos campos: ${campos}`);
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}
