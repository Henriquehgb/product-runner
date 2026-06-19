/**
 * encodeURIComponent não escapa ! ' ( ) * (RFC 3986). O ")" cru quebra o link
 * quando a URL é embutida num markdown link do Telegram (`[txt](url)`), que
 * encerra a URL no primeiro ")". Escapamos esses chars pra a URL ser segura
 * em qualquer contexto — e continua decodificando igual no WhatsApp.
 */
function encodeText(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/** Monta o link wa.me com a mensagem pré-preenchida (1 clique). */
export function montarLinkWaMe(telefone: string, mensagem: string): string {
  // wa.me espera o número sem "+" nem símbolos.
  const numero = telefone.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeText(mensagem)}`;
}
