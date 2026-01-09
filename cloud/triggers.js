var dateFormat = require('dateformat');

Parse.Cloud.beforeSave("_User", async (request) => {
  const { original, object } = request;
  
  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

Parse.Cloud.beforeDelete("_User", async (request) => {
  const { object } = request;

  const querySessions = new Parse.Query("_Session");
  querySessions.equalTo("user", object.toPointer());
  const sessions = await querySessions.find({ useMasterKey: true });
  sessions.forEach(object => {
    object.destroy({ useMasterKey: true });
  });
});

Parse.Cloud.beforeSave("UserDeleted", async (request) => {
  const { original, object, user } = request;
  
  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

Parse.Cloud.beforeSave("VersionApp", async (request) => {
  const { original, object, user } = request;
  
  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, false);
    acl.setWriteAccess(user.id, false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

Parse.Cloud.beforeSave("Notification", async (request) => {
  const { original, object } = request;

  if (original === undefined) {
    const recipient = object.get("recipient");

    const querySessions = new Parse.Query("_Session");
    const queryInstallations = new Parse.Query("_Installation");
    queryInstallations.notEqualTo('deviceToken', null);
    queryInstallations.notEqualTo('pushStatus', 'UNINSTALLED');
    
    querySessions.equalTo("user", recipient.toPointer());
    queryInstallations.matchesKeyInQuery("installationId", "installationId", querySessions);

    // const pushNotifications = object.relation('pushNotifications');
    
    const installations = await queryInstallations.find({ useMasterKey: true });

    if (installations.length == 0) {
      throw 'User has no installed App';
    }

    /* await Promise.all(installations.map(async (installation) => {
      const token = installation.get("deviceToken");
      
      const pushNotification = new Parse.Object("PushNotification");
      pushNotification.set("GCMSenderId", installation.get("GCMSenderId"));
      pushNotification.set("messageId", null);
      pushNotification.set("token", token);
      pushNotification.set("topic", null);
      pushNotification.set("delivered", null);

      var acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      acl.setReadAccess(recipient.id, false);
      acl.setWriteAccess(recipient.id, false);
      acl.setRoleReadAccess("Admin", true);
      acl.setRoleWriteAccess("Admin", true);
      
      pushNotification.setACL(acl);

      const title = object.get('title');
      const body = object.get('body');
      const imageUrl = object.get('imageUrl') ?? undefined;
      const data = object.get('data') !== undefined ? JSON.parse(object.get('data')) : undefined;

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

      pushNotifications.add(result);
    })); */
  }
});

Parse.Cloud.afterSave("Notification", async (request) => {
  const { object } = request;

  const pushNotificationsRelation = object.relation('pushNotifications');

  const pushNotificationsQuery = pushNotificationsRelation.query();

  const pushNotifications = await pushNotificationsQuery.find({ useMasterKey: true });

  if (pushNotifications.length > 0) {
    return;
  }
  
  const notificationId = object.id;
  const recipient = object.get("recipient");

  const querySessions = new Parse.Query("_Session");
  const queryInstallations = new Parse.Query("_Installation");
  queryInstallations.notEqualTo('deviceToken', null);
  queryInstallations.notEqualTo('pushStatus', 'UNINSTALLED');
  
  querySessions.equalTo("user", recipient.toPointer());
  queryInstallations.matchesKeyInQuery("installationId", "installationId", querySessions);

  const installations = await queryInstallations.find({ useMasterKey: true });

  await Promise.all(installations.map(async (installation) => {
    const token = installation.get("deviceToken");
    
    const pushNotification = new Parse.Object("PushNotification");
    pushNotification.set("GCMSenderId", installation.get("GCMSenderId"));
    pushNotification.set("messageId", null);
    pushNotification.set("token", token);
    pushNotification.set("topic", null);
    pushNotification.set("delivered", null);

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(recipient.id, false);
    acl.setWriteAccess(recipient.id, false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    pushNotification.setACL(acl);

    const title = object.get('title');
    const body = object.get('body');
    const imageUrl = object.get('imageUrl') ?? undefined;
    const data = object.get('data') !== undefined ? JSON.parse(object.get('data')) : undefined;

    if (data !== undefined) {
      data['notificationId'] = notificationId;
    }

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

    pushNotificationsRelation.add(result);
  }));

  object.save(null, { useMasterKey: true });
});

Parse.Cloud.afterSave("PushNotification", async (request) => {
  const { object } = request;

  const GCMSenderId = object.get("GCMSenderId");
  const data = JSON.parse(object.get("data"));
  const token = object.get("token");
  const topic = object.get("topic");
  const delivered = object.get('delivered');

  if (delivered === null) {

    var androidNotification = {
      'sound': 'default',
      'click_action': 'FLUTTER_NOTIFICATION_CLICK'
    };

    var appleNotification = {};

    if (data.image) {
      androidNotification['image'] = data.image;
      appleNotification['image'] = data.image;
    }

    const message = {
      'GCMSenderId': GCMSenderId,
      'message': {
        'token': token,
        'topic': topic,
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

    try {
      const response = await Parse.Cloud.run('pushNotification', message, { useMasterKey: true });
      const messageId = response['messageId'];

      object.set('messageId', messageId);
      object.set('delivered', true);
    } catch (error) {
      object.set('delivered', false);

      const queryInstallation = new Parse.Query("_Installation");
      queryInstallation.equalTo('deviceToken', token);
      const installation = await queryInstallation.first({ useMasterKey: true });

      if (installation !== undefined) {
        if (error.message == 'APP_WAS_UNINSTALLED') {
          installation.set('pushStatus', 'UNINSTALLED');
          installation.save(null, { useMasterKey: true });
        }
      }
    }

    object.save(null, { useMasterKey: true });
  }
});