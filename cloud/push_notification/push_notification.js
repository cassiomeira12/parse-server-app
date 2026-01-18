const { validationAdminRules } = require('../roles/validation_roles');
const authFirebasePushNotification = require('./auth_firebase_push_notification');
const axios = require('axios');
const { catchError } = require('../crashlytics');

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
  const token = params.message.token;
  const topic = params.message.topic;

  const pushNotification = new Parse.Object("PushNotification");
  pushNotification.set("GCMSenderId", GCMSenderId);
  pushNotification.set("messageId", null);
  pushNotification.set("token", token);
  pushNotification.set("topic", topic);
  pushNotification.set("delivered", null);

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  // acl.setReadAccess(recipient.id, false);
  // acl.setWriteAccess(recipient.id, false);
  acl.setRoleReadAccess("Admin", true);
  acl.setRoleWriteAccess("Admin", true);

  pushNotification.setACL(acl);

  const title = params.message.notification.title;
  const body = params.message.notification.body;
  const imageUrl = undefined;
  const data = params.message.data;

  const notificationData = {
    'notification': {
      'title': title,
      'body': body
    },
    'image': imageUrl,
    'data': data
  };

  pushNotification.set("data", JSON.stringify(notificationData));

  const result = await pushNotification.save(null, { useMasterKey: true });

  return result;
}, validationAdminRules, {
  fields: ['GCMSenderId', 'message'],
  requireUser: true
});

Parse.Cloud.define('subscribeTopic', async (request) => {
  const { params } = request;

  const topic = params.topic;
  const userId = request.user.id;

  var installations = await Parse.Cloud.run(
    'list-user-installations',
    { 'userId': userId },
    { useMasterKey: true }
  );

  installations = installations.filter((installation) => {
    const pushStatus = installation.get("pushStatus");
    const GCMSenderId = installation.get("GCMSenderId");
    const deviceToken = installation.get("deviceToken");
    return pushStatus === "INSTALLED" && GCMSenderId && deviceToken;
  });

  if (installations.length === 0) {
    throw 'device installation was not founded';
  }

  const topics = await Promise.all(
    installations.map(async (installation) => {
      const GCMSenderId = installation.get("GCMSenderId");
      const deviceToken = installation.get("deviceToken");
      try {
        const channels = await subscribeTopics(GCMSenderId, deviceToken, [topic]);
        installation.set('channels', channels);
        installation.save(null, { useMasterKey: true });
        return true;
      } catch (error) {
        if (error.response.status === 404 || error.response["statusText"] === 'Not Found') {
          installation.set('pushStatus', 'UNINSTALLED');
          installation.set('channels', []);
          installation.save(null, { useMasterKey: true });
          return false;
        }
        catchError(error);
        return false;
      }
    }),
  );

  if (topics.includes(true)) {
    const queryUser = new Parse.Query("_User");
    const user = await queryUser.get(userId, { useMasterKey: true });

    var pushTopics = user.get('pushTopics');
    if (pushTopics == undefined) {
      pushTopics = [];
    }
    
    if (pushTopics.includes(topic) === false) {
      pushTopics.push(topic);
      user.set('pushTopics', pushTopics);
      user.save(null, { useMasterKey: true });
    }

    return pushTopics;
  } else {
    throw 'topic was not subscribed';
  }
}, {
  fields: ['topic'],
  requireUser: true
});

Parse.Cloud.define('unsubscribeTopic', async (request) => {
  const { params } = request;

  const topic = params.topic;
  const userId = request.user.id;

  var installations = await Parse.Cloud.run(
    'list-user-installations',
    { 'userId': userId },
    { useMasterKey: true }
  );

  installations = installations.filter((installation) => {
    const pushStatus = installation.get("pushStatus");
    const GCMSenderId = installation.get("GCMSenderId");
    const deviceToken = installation.get("deviceToken");
    return pushStatus === "INSTALLED" && GCMSenderId && deviceToken;
  });

  if (installations.length === 0) {
    throw 'device installation was not founded';
  }

  const topics = await Promise.all(
    installations.map(async (installation) => {
      const GCMSenderId = installation.get("GCMSenderId");
      const deviceToken = installation.get("deviceToken");
      try {
        const channels = await unSubscribeTopics(GCMSenderId, deviceToken, [topic]);
        installation.set('channels', channels);
        installation.save(null, { useMasterKey: true });
        return true;
      } catch (error) {
        if (error.response.status === 404 || error.response["statusText"] === 'Not Found') {
          installation.set('pushStatus', 'UNINSTALLED');
          installation.set('channels', []);
          installation.save(null, { useMasterKey: true });
          return false;
        }
        catchError(error);
        return false;
      }
    }),
  );

  if (topics.includes(true)) {
    const queryUser = new Parse.Query("_User");
    const user = await queryUser.get(userId, { useMasterKey: true });

    var pushTopics = user.get('pushTopics');
    if (pushTopics == undefined) {
      pushTopics = [];
    }

    const pushTopicsUpdated = pushTopics.filter((pushTopic) => pushTopic !== topic);

    user.set('pushTopics', pushTopicsUpdated);
    user.save(null, { useMasterKey: true });

    return pushTopicsUpdated;
  } else {
    throw 'topic was not subscribed';
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

Parse.Cloud.beforeSave("PushNotification", async (request) => {
  const { original, object } = request;

  const GCMSenderId = object.get("GCMSenderId");
  const data = JSON.parse(object.get("data"));
  const token = object.get("token");
  const topic = object.get("topic");

  if (original === undefined) {
    var androidNotification = {
      'sound': 'default',
      'click_action': 'FLUTTER_NOTIFICATION_CLICK'
    };

    var appleNotification = {};

    if (data.image) {
      androidNotification['image'] = data.image;
      appleNotification['image'] = data.image;
    }

    const notification = {
      'GCMSenderId': GCMSenderId,
      'message': {
        // 'token': token,
        // 'topic': topic,
        'notification': data.notification,
        'data': data.data,
        'android': {
          'notification': androidNotification
        },
        'apns': {
          'payload': {
            'aps': data.data
          },
          'fcm_options': appleNotification
        }
      }
    };

    if (token) {
      notification.message['token'] = token;
    }

    if (topic) {
      notification.message['topic'] = topic;
    }

    try {
      const response = await pushNotification(notification);
      const messageId = response['messageId'];

      object.set('messageId', messageId);
      object.set('delivered', true);
    } catch (error) {
      catchError(error);
      object.set('delivered', false);
    }
  }
});

const pushNotification = async (notification) => {
  const GCMSenderId = notification.GCMSenderId;

  const authToken = await authFirebasePushNotification(GCMSenderId);

  const config = await Parse.Config.get({ useMasterKey: true });
  const firebaseProjectId = config.get(`projectId_${GCMSenderId}`);

  try {
    const response = await axios({
      method: 'post',
      url: `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
      data: {
        'message': notification.message,
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
    catchError(error);
    throw error;
  }
}

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
  
  Object.keys(data['rel']['topics']).forEach(function(key, index) {
    pushTopicsSubscribed.push(key);
  });

  return pushTopicsSubscribed;
}

const unSubscribeTopics = async (GCMSenderId, deviceToken, topics) => {
  const authToken = await authFirebasePushNotification(GCMSenderId);

  await Promise.all(
    topics.map((topic) => {
      return axios({
          method: 'delete',
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
  
  Object.keys(data['rel']['topics']).forEach(function(key, index) {
    pushTopicsSubscribed.push(key);
  });

  return pushTopicsSubscribed;
}

module.exports = { subscribeTopics, unSubscribeTopics };