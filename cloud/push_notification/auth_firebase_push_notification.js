const { GoogleToken } = require('gtoken');

async function authFirebasePushNotification(GCMSenderId) {
  const config = await Parse.Config.get({ useMasterKey: true });

  // Fomat private key without \n
  // https://www.samltool.com/format_privatekey.php

  const clientEmail = config.get(`email_${GCMSenderId}`);
  const firebasePrivateKey = config.get(`key_${GCMSenderId}`);

  const gtoken = new GoogleToken({
    email: `${clientEmail}`,
    scope: ['https://www.googleapis.com/auth/cloud-platform'],
    key: `${firebasePrivateKey}`,
    eagerRefreshThresholdMillis: 5 * 60 * 1000
  });

  const token = await gtoken.getToken();

  return token;
}

module.exports = authFirebasePushNotification;