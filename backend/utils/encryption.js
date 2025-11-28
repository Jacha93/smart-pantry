const crypto = require('crypto');

const PERSONAL_DATA_KEY = process.env.PERSONAL_DATA_KEY || '';

if (!PERSONAL_DATA_KEY || PERSONAL_DATA_KEY.length !== 64) {
  console.warn(
    '⚠️ PERSONAL_DATA_KEY ist nicht korrekt gesetzt. Verwende einen 32-Byte Hex-Schlüssel (64 Zeichen), um sensible Daten zu verschlüsseln.'
  );
}

function getKeyBuffer() {
  if (!PERSONAL_DATA_KEY || PERSONAL_DATA_KEY.length !== 64) {
    throw new Error('PERSONAL_DATA_KEY muss ein 32-Byte Hex-Wert sein (64 Zeichen).');
  }
  return Buffer.from(PERSONAL_DATA_KEY, 'hex');
}

function encryptField(plainText) {
  if (!plainText) return null;
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: authTag.toString('hex'),
  });
}

function decryptField(payload) {
  if (!payload) return null;
  const key = getKeyBuffer();
  let parsed;
  try {
    parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch (error) {
    return null;
  }
  if (!parsed?.iv || !parsed?.data || !parsed?.tag) return null;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(parsed.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(parsed.data, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

module.exports = {
  encryptField,
  decryptField,
};

