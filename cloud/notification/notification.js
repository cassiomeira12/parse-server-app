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
  fields: ['userId', 'title', 'body', 'imageUrl', 'data'],
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

    const installations = await queryInstallations.find({ useMasterKey: true });

    if (installations.length == 0) {
      throw 'User has no installed App';
    }

    const pushNotificationsRelation = object.relation('pushNotifications');
    const notificationId = object.id;

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
          'body': body,
          'imageUrl': imageUrl
        },
        'data': data
      };

      pushNotification.set("data", JSON.stringify(notificationData));

      const result = await pushNotification.save(null, { useMasterKey: true });

      pushNotificationsRelation.add(result);
    }));
  }
});
