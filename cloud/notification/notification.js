const { validationAdminRules } = require('../roles/validation_roles');

Parse.Cloud.define('add-notification', async (request) => {
  const { params } = request;

  const sender = request.user;
  const title = params.title;
  const body = params.body;
  const imageUrl = params.imageUrl;
  const data = params.data;

  const queryUser = new Parse.Query("_User");
  const recipient = await queryUser.get(params.userId, { useMasterKey: true });

  const notification = new Parse.Object("Notification");
  notification.set("sender", sender.toPointer());
  notification.set("recipient", recipient.toPointer());
  notification.set("title", title);
  notification.set("body", body);
  notification.set("imageUrl", imageUrl);
  notification.set("data", data !== null ? JSON.stringify(data) : null);
  notification.set("viewed", false);

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  acl.setReadAccess(recipient.id, true);
  acl.setWriteAccess(recipient.id, true);
  acl.setRoleReadAccess("Admin", true);
  acl.setRoleWriteAccess("Admin", true);
  
  notification.setACL(acl);

  return await notification.save(null, { useMasterKey: true }).then((result) => {
    return {
      objectId: result.id,
      title: result.get("title"),
      body: result.get("body"),
      viewed: result.get("viewed"),
      imageUrl: result.get("imageUrl"),
      data: result.get("data") !== undefined ? JSON.parse(result.get("data")) : null,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  });
}, validationAdminRules, {
  fields: ['userId', 'title', 'body'],
  requireUser: true
});

Parse.Cloud.define('list-notification', async (request) => {
  const { user } = request;

  const queryNotifications = new Parse.Query("Notification");
  queryNotifications.equalTo("recipient", user.toPointer());

  const response = await queryNotifications.find({ sessionToken: user.getSessionToken() });

  return response.filter((notification) => {
    // const title = product.get("name").toUpperCase();
    // const searchList = search.split(" ");
    // if (search.length > 0) {
    //   let matchSearch = false;
    //   searchList.forEach((value) => {
    //     if (title.includes(value)) {
    //       matchSearch = true;
    //     }
    //   });
    //   return matchSearch;
    // }
    return true;
  }).map((notification) => {
    return {
      objectId: notification.id,
      title: notification.get("title"),
      body: notification.get("body"),
      viewed: notification.get("viewed"),
      imageUrl: notification.get("imageUrl") ?? null,
      data: notification.get("data") === undefined ? null : JSON.parse(notification.get("data")),
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };
  });
}, {
  requireUser: true
});

Parse.Cloud.define('read-notification', async (request) => {
  const { params, user } = request;

  const notificationId = params.notificationId;

  const queryNotification = new Parse.Query("Notification");
  const notification = await queryNotification.get(notificationId, { sessionToken: user.getSessionToken() });

  notification.set("viewed", true);

  return await notification.save(null, { sessionToken: user.getSessionToken() }).then((result) =>  {
    return {
      objectId: result.id,
      title: result.get("title"),
      body: result.get("body"),
      viewed: result.get("viewed"),
      imageUrl: result.get("imageUrl") ?? null,
      data: result.get("data") === undefined ? null : JSON.parse(result.get("data")),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  });
}, {
  fields: ['notificationId'],
  requireUser: true
});

Parse.Cloud.define('test-push-notification', async (request) => {
  const { params, headers } = request;

  const title = params.title;
  const body = params.body;
  const imageUrl = params.imageUrl;

  const ip = (headers['ip'] ?? request.ip).replace('::ffff:','');

  const installationId = `${ip} ${request.installationId}`.toLowerCase();

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);
  
  const currentInstallation = await queryInstallation.first({ useMasterKey: true });

  if (currentInstallation === undefined) {
    throw 'Installation not found';
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

  var androidNotification = {
    'sound': 'default',
    'click_action': 'FLUTTER_NOTIFICATION_CLICK'
  };

  var appleNotification = {};

  if (imageUrl) {
    androidNotification['image'] = imageUrl;
    appleNotification['image'] = imageUrl;
  }

  const message = {
    'GCMSenderId': currentInstallation.get("GCMSenderId"),
    'message': {
      'token': currentInstallation.get("deviceToken"),
      'notification': notification,
      'data': {
        'action': 'test_push_notification',
        'notificationId': 'test_push_notification'
      },
      'android': {
        'notification': androidNotification
      },
      'apns': {
        'payload': {
          'aps': {
            'action': 'test_push_notification',
            'notificationId': 'test_push_notification'
          },
        },
        'fcm_options': appleNotification
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
  queryRole.includeAll();

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

    var notification = {
      'title': title,
      'body': body,
    };

    var androidNotification = {
      'sound': 'default',
      'click_action': 'FLUTTER_NOTIFICATION_CLICK'
    };
  
    var appleNotification = {};

    installations.map((installation) => {
      const message = {
        'GCMSenderId': installation.get("GCMSenderId"),
        'message': {
          'topic': user.id,
          'notification': notification,
          'data': {
            'action': 'test_push_notification',
            'notificationId': 'test_push_notification'
          },
          'android': {
            'notification': androidNotification
          },
          'apns': {
            'payload': {
              'aps': {
                'action': 'test_push_notification',
                'notificationId': 'test_push_notification'
              },
            },
            'fcm_options': appleNotification
          }
        }
      };

      Parse.Cloud.run('pushNotification', message, { useMasterKey: true });
    });
  }));
}, {
  fields: ['title', 'body']
});