const { authenticator } = require('otplib');

const { encryptData, decryptData } = require('../encrypt/encrypt');
const { validationAdminRules } = require('../../roles/validation_roles');

Parse.Cloud.define('dev-otp-code', async (request) => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const secret = config.get('otp_secret');
  const code = authenticator.generate(secret);
  const encryptedCode = await encryptData(code);
  return encryptedCode;
}, validationAdminRules, {
  requireUser: false
});

Parse.Cloud.define('generate-otp-secret', async (request) => {
  return authenticator.generateSecret();
});

const validationOTPCode = async headers => {
  if (headers === undefined || headers['hash-token-code'] === undefined) {
    throw 'request_hash_token_code';
  }

  const encryptedToken = headers['hash-token-code'];
  
  const token = await decryptData(encryptedToken);

  const config = await Parse.Config.get({ useMasterKey: true });
  const secret = config.get('otp_secret');
  
  const isValid = authenticator.verify({ token, secret });
  
  if (isValid == false) {
    throw 'invalid_hash_token_code';
  }
}

module.exports = { validationOTPCode };