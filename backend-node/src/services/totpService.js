const crypto = require('crypto');

// Base32 Alphabet (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode Buffer to Base32 String
 */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode Base32 String to Buffer
 */
function base32Decode(base32Str) {
  const clean = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate standard 20-byte Base32 Secret (for Google/Microsoft Authenticator)
 */
function generateSecret(bytesLength = 20) {
  const randomBuf = crypto.randomBytes(bytesLength);
  return base32Encode(randomBuf);
}

/**
 * Generate 6-digit TOTP Token for a given time
 */
function generateToken(secret, time = Date.now()) {
  const secretBuffer = base32Decode(secret);
  const timeStep = 30; // 30 seconds
  const counter = Math.floor(time / 1000 / timeStep);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuf);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify 6-digit TOTP Token with window tolerance
 */
function verifyToken(secret, token, window = 1) {
  if (!secret || !token) return false;
  const cleanToken = String(token).trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6) return false;

  const now = Date.now();
  const timeStepMs = 30 * 1000;

  for (let i = -window; i <= window; i++) {
    const checkTime = now + i * timeStepMs;
    const generated = generateToken(secret, checkTime);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(generated))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate otpauth:// URI for QR Code scanning in Authenticator apps
 */
function generateURI(label, secret, issuer = 'UIH RPM Portal') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedLabel = encodeURIComponent(label);
  return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  generateSecret,
  generateToken,
  verifyToken,
  generateURI
};
