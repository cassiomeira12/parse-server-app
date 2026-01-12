const { validationAdminRules } = require('../roles/validation_roles');
const authFirebasePushNotification = require('./auth_firebase_push_notification');
const axios = require('axios');

Parse.Cloud.define('googleAuthToken', async (request) => {
  const { params } = request;

  const GCMSenderId = params.GCMSenderId;

  const authToken = await authFirebasePushNotification(GCMSenderId);
  return authToken;
}, validationAdminRules, {
  fields: ['GCMSenderId'],
  requireUser: true
});

Parse.Cloud.define('pushNotification', async (request) => {
  const { params } = request;

  const GCMSenderId = params.GCMSenderId;

  const authToken = await authFirebasePushNotification(GCMSenderId);

  const config = await Parse.Config.get({ useMasterKey: true });
  const firebaseProjectId = config.get(`projectId_${GCMSenderId}`);

  try {
    const response = await axios({
      method: 'post',
      url: `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
      data: {
        'message': params.message,
      },
      headers: {
        'Authorization': `Bearer ${authToken.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const messageId = response.data.name.replace(`projects/${firebaseProjectId}/messages/`, '');

    return {
      'messageId': messageId,
    };
  } catch (error) {
    if (error.response.status === 404 || error.response === 'Not Found') {
      throw 'APP_WAS_UNINSTALLED';
    }
    throw error;
  }

}, validationAdminRules, {
  fields: ['GCMSenderId', 'message'],
  requireUser: true
});

Parse.Cloud.define('subscribeTopic', async (request) => {
  const { params, headers } = request;

  const topic = params.topic;

  const ip = (headers['ip'] ?? request.ip).replace('::ffff:','');
  const installationId = `${ip} ${request.installationId}`.toLowerCase();

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);
  
  const queryUser = new Parse.Query("_User");

  const responseResults = await Promise.all([
    queryInstallation.first({ useMasterKey: true }),
    queryUser.get(request.user.id, { useMasterKey: true })
  ]);

  const currentInstallation = responseResults[0];
  const user = responseResults[1];

  if (currentInstallation === undefined) {
    throw 'device installation was not founded';
  }

  const GCMSenderId = currentInstallation.get("GCMSenderId");;
  const deviceToken = currentInstallation.get("deviceToken");

  if (deviceToken === undefined) {
    throw 'device has no firebase push token';
  }

  try {
    const channels = await subscribeTopics(GCMSenderId, deviceToken, [topic]);

    currentInstallation.set('channels', channels);
    currentInstallation.save(null, { useMasterKey: true });

    var pushTopics = user.get('pushTopics');
    if (pushTopics == undefined) {
      pushTopics = [];
    }
    pushTopics.push(topic);
    user.set('pushTopics', pushTopics);
    user.save(null, { useMasterKey: true });

    return channels;
  } catch (error) {
    throw error;
  }
}, {
  fields: ['topic'],
  requireUser: true
});

Parse.Cloud.define('unsubscribeTopic', async (request) => {
  const { params, headers } = request;

  const topic = params.topic;

  const ip = (headers['ip'] ?? request.ip).replace('::ffff:','');
  const installationId = `${ip} ${request.installationId}`.toLowerCase();

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);

  const queryUser = new Parse.Query("_User");

  const responseResults = await Promise.all([
    queryInstallation.first({ useMasterKey: true }),
    queryUser.get(request.user.id, { useMasterKey: true })
  ]);

  const currentInstallation = responseResults[0];
  const user = responseResults[1];
  
  if (currentInstallation === undefined) {
    throw 'device installation was not founded';
  }

  const GCMSenderId = currentInstallation.get("GCMSenderId");;
  const deviceToken = currentInstallation.get("deviceToken");

  if (deviceToken === undefined) {
    throw 'device has no firebase push token';
  }

  try {
    const authToken = await authFirebasePushNotification(GCMSenderId);

    await axios({
      method: 'delete',
      url: `https://iid.googleapis.com/iid/v1/${deviceToken}/rel/topics/${topic}`,
      headers: {
        'Authorization': `Bearer ${authToken.access_token}`,
        'access_token_auth': 'true'
      }
    });

    const topicsResponse = await axios({
      method: 'get',
      url: `https://iid.googleapis.com/iid/info/${deviceToken}`,
      params: {
        'details': true,
      },
      headers: {
        'Authorization': `Bearer ${authToken.access_token}`,
        'access_token_auth': 'true'
      }
    });

    const data = topicsResponse.data;
    const topics = data['rel']['topics'];

    const channels = [];

    Object.keys(topics).forEach(function(key, index) {
      channels.push(key);
    });

    currentInstallation.set('channels', channels);
    currentInstallation.save(null, { useMasterKey: true });

    var pushTopics = user.get('pushTopics');
    if (pushTopics == undefined) {
      pushTopics = [];
    }

    const pushTopicsUpdated = pushTopics.filter((pushTopic) => pushTopic !== topic);
  
    user.set('pushTopics', pushTopicsUpdated);
    user.save(null, { useMasterKey: true });

    return channels;
  } catch (error) {
    throw error;
  }
}, {
  fields: ['topic'],
  requireUser: true
});

Parse.Cloud.define('addCredentialsKeys', async (request) => {
  const { params } = request;

  const firebaseProjectId = params.firebaseProjectId;
  const firebaseProjectNumber = params.firebaseProjectNumber;
  const clientEmail = params.clientEmail;
  const privateKey = params.privateKey;

  const projectIdConfigName = `projectId_${firebaseProjectNumber}`;
  const emailConfigName = `email_${firebaseProjectNumber}`;
  const privateKeyConfigName = `key_${firebaseProjectNumber}`;

  const configKeys = {};
  const masterKeyOnly = {};

  configKeys[projectIdConfigName] = firebaseProjectId;
  masterKeyOnly[projectIdConfigName] = true;

  configKeys[emailConfigName] = clientEmail;
  masterKeyOnly[emailConfigName] = true;

  configKeys[privateKeyConfigName] = privateKey;
  masterKeyOnly[privateKeyConfigName] = true;

  const result = await Parse.Config.save(configKeys, masterKeyOnly);

  Object.keys(configKeys).forEach(function(key, index) {
    configKeys[key] = result['attributes'][key] != undefined;
  });

  return configKeys;
}, validationAdminRules, {
  fields: ['firebaseProjectId', 'firebaseProjectNumber', 'clientEmail', 'privateKey'],
  requireUser: true
});

const subscribeTopics = async (GCMSenderId, deviceToken, topics) => {
  const authToken = await authFirebasePushNotification(GCMSenderId);

  await Promise.all(
    topics.map((topic) => {
      return axios({
        method: 'post',
        url: `https://iid.googleapis.com/iid/v1/${deviceToken}/rel/topics/${topic}`,
        headers: {
          'Authorization': `Bearer ${authToken.access_token}`,
          'access_token_auth': 'true'
        }
      });
    }),
  );

  const topicsResponse = await axios({
    method: 'get',
    url: `https://iid.googleapis.com/iid/info/${deviceToken}`,
    params: {
      'details': true,
    },
    headers: {
      'Authorization': `Bearer ${authToken.access_token}`,
      'access_token_auth': 'true'
    }
  });

  const pushTopicsSubscribed = [];
  
  const data = topicsResponse.data;
  console.log(data);
  
  Object.keys(data['rel']['topics']).forEach(function(key, index) {
    pushTopicsSubscribed.push(key);
  });

  return pushTopicsSubscribed;
}

module.exports = { subscribeTopics };