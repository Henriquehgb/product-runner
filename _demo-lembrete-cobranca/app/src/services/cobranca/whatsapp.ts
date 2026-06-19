/** Monta o link wa.me com a mensagem pré-preenchida (1 clique). */
export function montarLinkWaMe(telefone: string, mensagem: string): string {
  // wa.me espera o número sem "+" nem símbolos.
  const numero = telefone.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
