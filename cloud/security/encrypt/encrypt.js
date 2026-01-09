// https://www.sohamkamani.com/nodejs/rsa-encryption/

const crypto = require('crypto');
const nodeBase64 = require('nodejs-base64-converter');

Parse.Cloud.define('generate-key-pair', async (request) => {
  return generateRsaKeys();
});

// Parse.Cloud.define('encrypt', async (request) => {
//   const { params } = request;
//   const data = params.data;
//   return await encryptData(data);
// });

// Parse.Cloud.define('decrypt', async (request) => {
//   const { params } = request;
//   const data = params.data;
//   return await decryptData(data);
// });

function generateRsaKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const publicKeyBase64 = nodeBase64.encode(publicKey);
  const privateKeyBase64 = nodeBase64.encode(privateKey);

  return {
    'publicKey': publicKey,
    'privateKey': privateKey,
    'publicKeyBase64': publicKeyBase64,
    'privateKeyBase64': privateKeyBase64,
  };
}

async function encryptData(data) {
  try {
    const config = await Parse.Config.get({ useMasterKey: true });
    const key = config.get('rsa_public_key');

    const publicKey = nodeBase64.decode(key);

    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
    return encrypted.toString('base64');
  } catch (error) {
    throw 'Encrypt Data ' + error;
  }
}

async function decryptData(data) {
  try {
    const config = await Parse.Config.get({ useMasterKey: true });
    const key = config.get('rsa_private_key');

    const privateKey = nodeBase64.decode(key);

    const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(data, 'base64'));
    return decrypted.toString();
  } catch (error) {
    throw 'Decrypted Data ' + error;
  }
}

module.exports = { generateRsaKeys, encryptData, decryptData };