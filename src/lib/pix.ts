import QRCode from 'qrcode';

export interface PixParams {
  /** Chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória) */
  key: string;
  /** Valor em reais (ex: 150 = R$ 150,00) */
  value: number;
  /** Nome do recebedor (max 25 chars). Será normalizado pra maiúsculas. */
  name: string;
  /** Cidade do recebedor (max 15 chars). Será normalizado pra maiúsculas. */
  city: string;
  /** Identificador da transação (max 25 chars alfanuméricos). '***' = não informar. */
  txid?: string;
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return id + len + value;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(payload);
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function sanitizeTxid(s: string): string {
  return stripDiacritics(s).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
}

export function buildPixPayload({
  key,
  value,
  name,
  city,
  txid = '***',
}: PixParams): string {
  const normalizedKey = /^\d/.test(key.trim())
    ? key.replace(/\D/g, '')
    : key.trim();
  const normalizedName = stripDiacritics(name).toUpperCase().slice(0, 25);
  const normalizedCity = stripDiacritics(city).toUpperCase().slice(0, 15);
  const normalizedTxid = txid === '***' ? '***' : sanitizeTxid(txid);

  const merchant = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', normalizedKey);
  const additionalData = tlv('05', normalizedTxid);

  const payload = [
    tlv('00', '01'),
    tlv('26', merchant),
    tlv('52', '0000'),
    tlv('53', '986'),
    tlv('54', value.toFixed(2)),
    tlv('58', 'BR'),
    tlv('59', normalizedName),
    tlv('60', normalizedCity),
    tlv('62', additionalData),
  ].join('');

  const withCrcField = payload + '6304';
  const crc = crc16(withCrcField);
  return withCrcField + crc;
}

export async function pixQrSvg(payload: string): Promise<string> {
  return await QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#2a2118', light: '#ffffff' },
  });
}
