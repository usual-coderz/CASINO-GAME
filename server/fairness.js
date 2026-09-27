/**
 * PROVABLY FAIR CRASH POINT GENERATION
 * 
 * Uses HMAC-SHA256 with server seed + client seed + nonce
 * This is the EXACT algorithm used by major platforms
 */

const crypto = require('crypto');

/**
 * Generate a new server seed (32 random bytes)
 * @returns {string} Hex-encoded 64 character string
 */
function generateServerSeed() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compute SHA256 hash of server seed
 * @param {string} serverSeed 
 * @returns {string} Hex-encoded hash
 */
function hashServerSeed(serverSeed) {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

/**
 * Calculate crash point from seeds using HMAC-SHA256
 * 
 * Algorithm:
 * 1. HMAC = HMAC-SHA256(serverSeed, clientSeed:nonce)
 * 2. Take first 13 hex chars (52 bits)
 * 3. Convert to integer h
 * 4. result = floor((100 * 2^52 - h) / (2^52 - h)) / 100
 * 5. Max with 1.00 (minimum crash point)
 * 
 * Properties:
 * - RTP = 99%, house edge = 1%
 * - P(crash == 1.00x) ≈ 1% (instant bust)
 * - Memoryless distribution
 * - Deterministic: same inputs = same output
 * 
 * @param {string} serverSeed 
 * @param {string} clientSeed 
 * @param {number} nonce 
 * @returns {number} Crash multiplier (e.g., 2.34)
 */
function crashPointFromSeed(serverSeed, clientSeed, nonce) {
  const hmac = crypto.createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');

  // Take first 13 hex chars = 52 bits
  const h = parseInt(hmac.slice(0, 13), 16);
  const e = Math.pow(2, 52);

  // Stake's formula: floor((100 * e - h) / (e - h)) / 100
  const result = Math.floor((100 * e - h) / (e - h)) / 100;

  return Math.max(1.00, result);
}

/**
 * Verify that a server seed matches its hash
 * @param {string} serverSeed 
 * @param {string} serverSeedHash 
 * @returns {boolean}
 */
function verifyServerSeed(serverSeed, serverSeedHash) {
  return hashServerSeed(serverSeed) === serverSeedHash;
}

/**
 * Generate a random client seed
 * @returns {string} 16 random hex chars
 */
function generateClientSeed() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = {
  generateServerSeed,
  hashServerSeed,
  crashPointFromSeed,
  verifyServerSeed,
  generateClientSeed
};