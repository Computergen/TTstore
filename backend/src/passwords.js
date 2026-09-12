const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

function derive(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, KEY_LENGTH, {
      N: COST,
      r: BLOCK_SIZE,
      p: PARALLELIZATION,
      maxmem: 32 * 1024 * 1024
    }, (error, key) => error ? reject(error) : resolve(key.toString('hex')));
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = await derive(password, salt);
  return `scrypt:${COST}:${BLOCK_SIZE}:${PARALLELIZATION}:${salt}:${hash}`;
}

async function verifyPassword(password, encoded) {
  const [algorithm, cost, blockSize, parallelization, salt, expected] = String(encoded || '').split(':');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = await derive(password, salt);
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex')) && Number(cost) === COST && Number(blockSize) === BLOCK_SIZE && Number(parallelization) === PARALLELIZATION;
}

module.exports = { hashPassword, verifyPassword };
