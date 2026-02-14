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
  const token = params.token;
  const topic = params.topic;
  const message = params.message;

  const pushNotification = new Parse.Object("PushNotification");
  pushNotification.set("GCMSenderId", GCMSenderId);
  pushNotification.set("messageId", null);
  pushNotification.set("token", token);
  pushNotification.set("topic", topic);
  pushNotification.set("delivered", null);

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  acl.setRoleReadAccess("Admin", true);
  acl.setRoleWriteAccess("Admin", true);

  pushNotification.setACL(acl);

  const title = message.notification.title;
  const body = message.notification.body;
  const imageUrl = message.notification.imageUrl;
  const data = message.data;

  const notificationData = {
    'notification': {
      'title': title,
      'body': body,
      'imageUrl': imageUrl
    },
    'data': data
  };

  pushNotification.set("data", JSON.stringify(notificationData));

  const result = await pushNotification.save(null, { useMasterKey: true });

  return {
    objectId: result.id,
    GCMSenderId: result.get('GCMSenderId'),
    topic: result.get('topic'),
    data: JSON.parse(result.get('data')),
    messageId: result.get('messageId'),
    delivered: result.get('delivered'),
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}, validationAdminRules, {
  fields: ['GCMSenderId', 'message'],
  requireUser: true
});

Parse.Cloud.define('test-push-notification', async (request) => {
  const { params } = request;

  const title = params.title;
  const body = params.body;

  const installationId = request.installationId;

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);
  
  const currentInstallation = await queryInstallation.first({ useMasterKey: true });

  if (currentInstallation === undefined) {
    throw new Parse.Error(404, 'installation not found');
  }

  const locale = currentInstallation.get("localeIdentifier");

  var notification = {
    'title': title ?? 'Notificação push',
    'body': body ?? 'Você receberá atualizações de conta em tempo real, alertas de segurança e outras informações importantes.'
  };

  if (locale === 'en_US') {
    notification['title'] = title ?? 'Notification Push';
    notification['body'] = body ?? 'You\'ll receive real-time account updates, security alerts, and other important information.';
  }

  const message = {
    'GCMSenderId': currentInstallation.get('GCMSenderId'),
    'token': currentInstallation.get('deviceToken'),
    'message': {
      'notification': {
        'title': notification['title'],
        'body': notification['body']
      },
      'data': {
        'action': 'test_push_notification',
        'tag': 'test_push_notification',
      }
    }
  };

  return await Parse.Cloud.run('pushNotification', message, { useMasterKey: true });
}, {
  requireUser: true
});

Parse.Cloud.define('alert-admins', async (request) => {
  const { params } = request;

  const title = params.title;
  const body = params.body;

  const queryRole = new Parse.Query("_Role");
  queryRole.equalTo("name", "Admin");

  const role = await queryRole.first({ useMasterKey: true });

  const users = await role.get("users").query().find({ useMasterKey: true });

  await Promise.all(users.map(async (user) => {
    const querySessions = new Parse.Query("_Session");
    const queryInstallations = new Parse.Query("_Installation");
    queryInstallations.notEqualTo('deviceToken', null);
    queryInstallations.notEqualTo('pushStatus', 'UNINSTALLED');
    
    querySessions.equalTo("user", user.toPointer());
    queryInstallations.matchesKeyInQuery("installationId", "installationId", querySessions);
  
    const installations = await queryInstallations.find({ useMasterKey: true });

    installations.map((installation) => {
      const message = {
        'GCMSenderId': installation.get('GCMSenderId'),
        'topic': user.id,
        'message': {
          'notification': {
            'title': title,
            'body': body
          },
          'data': {
            'action': 'admin-alert',
            'tag': 'admin-alert',
          }
        }
      };

      Parse.Cloud.run('pushNotification', message, { useMasterKey: true });
    });
  }));
}, {
  fields: ['title', 'body'],
});

Parse.Cloud.define('subscribeTopic', async (request) => {
  const { params } = request;

  const topics = params.topics;
  const installationId = request.installationId;

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);

  const installation = await queryInstallation.first({ useMasterKey: true });

  const GCMSenderId = installation.get("GCMSenderId");
  const deviceToken = installation.get("deviceToken");

  if (GCMSenderId && deviceToken) {
    try {
      const topicsSubscribed = await subscribeTopics(GCMSenderId, deviceToken, topics);
      installation.set("channels", topicsSubscribed);
      installation.save(null, { useMasterKey: true });
      return topicsSubscribed;
    } catch (error) {
      catchError(error);
      throw error;
    }
  }
}, {
  fields: ['topics'],
});

Parse.Cloud.define('unsubscribeTopic', async (request) => {
  const { params } = request;

  const topics = params.topics;
  const installationId = request.installationId;

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);

  const installation = await queryInstallation.first({ useMasterKey: true });

  const GCMSenderId = installation.get("GCMSenderId");
  const deviceToken = installation.get("deviceToken");

  if (GCMSenderId && deviceToken) {
    try {
      const topicsSubscribed = await unSubscribeTopics(GCMSenderId, deviceToken, topics);
      installation.set("channels", topicsSubscribed);
      installation.save(null, { useMasterKey: true });
      return topicsSubscribed;
    } catch (error) {
      catchError(error);
      throw error;
    }
  }
}, {
  fields: ['topics'],
});

Parse.Cloud.define('subscribeUserTopic', async (request) => {
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
    throw new Parse.Error(404, 'device installation was not founded');
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

Parse.Cloud.define('unsubscribeUserTopic', async (request) => {
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
    throw new Parse.Error(404, 'device installation was not founded');
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
  const token = object.get("token");
  const topic = object.get("topic");
  const notificationData = JSON.parse(object.get("data"));

  const notification = notificationData.notification;

  const title = notification.title;
  const body = notification.body;
  const imageUrl = notification.imageUrl;
  const data = notificationData.data;

  if (original === undefined) {
    var message = createPushMessageJson(
      title,
      body,
      imageUrl,
      GCMSenderId,
      token,
      topic,  
      null,
      data,
    );

    try {
      const response = await pushNotification(message);
      const messageId = response['messageId'];

      object.set('messageId', messageId);
      object.set('delivered', true);
    } catch (error) {
      if (error.code === 'ERR_BAD_REQUEST') {
        throw new Parse.Error(error.status, error.message);
      }
      if (error !== 'Incorrect Firebase Messaging Project') {
        catchError(error);
      }
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

const createPushMessageJson = (
  title,
  body,
  imageUrl,
  GCMSenderId,
  token,
  topic,
  restrictPackageName,
  data,
) => {
  // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages

  if (token == undefined && topic == undefined) {
    throw 'Error: token and topic null';
  }

  if (token != undefined && topic != undefined) {
    throw 'Error: token or topic must be null';
  }

  const notification = {
    'title': title,
    'body': body,
  };

  const tag = data.tag;
  const sticky = data.sticky === 'true';

  var androidNotification = {
    'channel_id': 'push_notification',
    'sound': 'default',
    'click_action': 'FLUTTER_NOTIFICATION_CLICK',
    'notification_priority': 'PRIORITY_HIGH',
    'tag': tag, // replace notification when existing one in the notification drawer
    'sticky': sticky, // persistent notification
  };

  var appleNotification = {};

  if (imageUrl) {
    androidNotification['image'] = imageUrl;
    appleNotification['image'] = imageUrl;
  }

  var message = {
    'data': data,
    'notification': notification,
    'android': {
      // 'collapse_key": "5658586678087056",
      'restricted_package_name': restrictPackageName,
      'notification': androidNotification,
    },
    'webpush': {
      'data': data,
      'notification': notification,
    },
    'apns': {
      'headers': {
        // 'apns-collapse-id': '5658586678087056'
      },
      'payload': {
        'aps': data,
      },
      'fcm_options': appleNotification
    },
  };

  if (token != undefined) {
    message['token'] = token;
  }

  if (topic != undefined) {
    message['topic'] = topic;
  }

  return {
    'GCMSenderId': GCMSenderId,
    'message': message,
  };
}

module.exports = { subscribeTopics, unSubscribeTopics, createPushMessageJson };