const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function mesExtenso(data: Date): string {
  return MESES[data.getMonth()]!;
}

export function formatarValor(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

export function formatarDataDDMM(data: Date): string {
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

/** Template confirmado no gate da documentação funcional. */
export function montarMensagem(args: {
  nome: string;
  vencimento: Date;
  valor: number;
  pix: string;
}): string {
  const { nome, vencimento, valor, pix } = args;
  return (
    `Olá, ${nome}! Passando pra lembrar da mensalidade de ${mesExtenso(vencimento)}, ` +
    `no valor de R$ ${formatarValor(valor)}, com vencimento em ${formatarDataDDMM(vencimento)}. ` +
    `Você pode pagar via Pix (copia e cola): ${pix}. Qualquer dúvida, é só chamar. Obrigado!`
  );
}
