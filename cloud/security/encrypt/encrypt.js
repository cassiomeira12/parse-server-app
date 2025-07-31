// https://www.sohamkamani.com/nodejs/rsa-encryption/

const crypto = require('crypto');

Parse.Cloud.define('generate-key-pair', async (request) => {
  return generateRsaKeys();
});

// Parse.Cloud.define('encrypt', async (request) => {
//   const { params } = request;

//   const data = params.data;

//   const config = await Parse.Config.get({ useMasterKey: true });
//   const key = config.get('rsa_public_key');

//   return encryptData(data, key);
// });

// Parse.Cloud.define('decrypt', async (request) => {
//   const { params } = request;
//   const data = params.data;
//   return await decryptData(data);
// });

function generateRsaKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return {'publicKey': publicKey, 'privateKey': privateKey};
}

function encryptData(data, publicKey) {
  const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
  return encrypted.toString('base64');
}

async function decryptData(data) {
  try {
    const config = await Parse.Config.get({ useMasterKey: true });
    const key = config.get('rsa_private_key');
    const decrypted = crypto.privateDecrypt(key, Buffer.from(data, 'base64'));
    return decrypted.toString();
  } catch (error) {
    throw 'Decrypted Data ' + error;
  }
}

module.exports = { generateRsaKeys, encryptData, decryptData };