/**
 * Geração do Pix copia-e-cola (BR Code EMV-MPM estático), offline.
 * Layout: Banco Central / EMVCo. CRC16-CCITT (FALSE): init 0xFFFF, poly 0x1021.
 */

/** CRC16-CCITT-FALSE em hex maiúsculo de 4 dígitos. Vetor canônico: "123456789" -> 29B1. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Monta um campo EMV: id + comprimento(2) + valor. */
function emv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

/** Remove acentos e limita tamanho (campos 59/60 do BR Code). */
function sanitizar(texto: string, max: number): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().slice(0, max);
}

export function gerarPixCopiaECola(args: {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
}): string {
  const { chave, nome, cidade, valor } = args;

  const merchantAccount = emv("00", "br.gov.bcb.pix") + emv("01", chave);
  const additionalData = emv("05", "***"); // txid livre

  const semCrc =
    emv("00", "01") + // Payload Format Indicator
    emv("26", merchantAccount) + // Merchant Account Information (Pix)
    emv("52", "0000") + // Merchant Category Code
    emv("53", "986") + // Moeda: BRL
    emv("54", valor.toFixed(2)) + // Valor
    emv("58", "BR") + // País
    emv("59", sanitizar(nome, 25)) + // Recebedor
    emv("60", sanitizar(cidade, 15)) + // Cidade
    emv("62", additionalData) + // Dados adicionais (txid)
    "6304"; // ID + len do CRC, antes de calcular

  return semCrc + crc16(semCrc);
}
