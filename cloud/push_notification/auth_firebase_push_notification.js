const { GoogleToken } = require('gtoken');
const { catchError } = require('../crashlytics');

async function authFirebasePushNotification(GCMSenderId) {
  const config = await Parse.Config.get({ useMasterKey: true });

  const gcmTokenName = `gcm_token_${GCMSenderId}`;
  const locallyToken = await getGCMTokenSaved(gcmTokenName);
  if (locallyToken != undefined) {
    return locallyToken;
  }

  const clientEmail = config.get(`email_${GCMSenderId}`);
  const firebasePrivateKey = config.get(`key_${GCMSenderId}`);

  const googleToken = new GoogleToken({
    scope: ['https://www.googleapis.com/auth/cloud-platform'],
    email: clientEmail,
    key: firebasePrivateKey,
  });

  try {
    const token = await googleToken.getToken();
    // Save GCM token for next request
    saveGCMTokenLocally(gcmTokenName, token);
    return token;
  } catch (error) {
    if (error.code === 'ERR_OSSL_UNSUPPORTED') {
      throw 'Incorrect Firebase Messaging Project';
    }
    catchError(error);
  }
}

async function getGCMTokenSaved(gcmTokenName) {
  const config = await Parse.Config.get({ useMasterKey: true });
  const GCMTokenData = config.get(gcmTokenName);

  if (GCMTokenData == null) return null;

  const GCMTokenJson = JSON.parse(GCMTokenData);
  const now = new Date();
  const time = new Date(GCMTokenJson['time']);

  var difference = now.getTime() - time.getTime();
  var diffInMinutes = Math.round(difference / 60000);

  if (diffInMinutes < 1) {
    // use valid GCM token before 60 min expires
    const token = GCMTokenJson['token'];
    return token;
  }

  // token expired
  return null;
}

function saveGCMTokenLocally(gcmTokenName, token) {
  const GCMTokenJson = { 'time': new Date(), 'token': token }
  const configKeys = {};
  const masterKeyOnly = {};
  configKeys[gcmTokenName] = JSON.stringify(GCMTokenJson);
  masterKeyOnly[gcmTokenName] = true;

  Parse.Config.save(configKeys, masterKeyOnly);
}

module.exports = authFirebasePushNotification;