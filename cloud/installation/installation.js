const { validationAdminRules } = require('../roles/validation_roles');
const { subscribeTopics, unSubscribeTopics } = require('../push_notification/push_notification');
const { catchError } = require('../crashlytics');

Parse.Cloud.define('installation', async (request) => {
  const { params, headers } = request;

  const installationId = params.installationId;
  const appName = params.appName;
  const appVersion = params.appVersion;
  const appIdentifier = params.appIdentifier;
  const GCMSenderId = params.GCMSenderId;
  const deviceToken = params.deviceToken;
  const pushType = params.pushType;
  const deviceId = params.deviceId;
  const deviceBrand = params.deviceBrand;
  const deviceModel = params.deviceModel;
  const deviceType = params.deviceType;
  const deviceOsVersion = params.deviceOsVersion;
  const timeZone = params.timeZone;
  const localeIdentifier = params.localeIdentifier;
  const platform = params.platform;
  
  const ip = (headers['ip'] ?? request.ip).replace('::ffff:','');

  var userPushTopics = [];
  
  if (request.user != undefined) {
    const queryUser = new Parse.Query("_User");
    const user = await queryUser.get(request.user.id, { useMasterKey: true });
    const userTopics = user.get('pushTopics');
    userTopics.map((topic) => userPushTopics.push(topic));
  }

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);

  const currentInstallation = await queryInstallation.first({ useMasterKey: true });

  if (currentInstallation == undefined) {
    const installation = new Parse.Object("_Installation");
    installation.set("installationId", installationId);
    installation.set("appName", appName);
    installation.set("appVersion", appVersion);
    installation.set("appIdentifier", appIdentifier);
    installation.set("channels", userPushTopics);
    installation.set("GCMSenderId", GCMSenderId);
    installation.set("deviceToken", deviceToken);
    installation.set("pushType", pushType);
    installation.set("deviceId", deviceId);
    installation.set("deviceBrand", deviceBrand);
    installation.set("deviceModel", deviceModel);
    installation.set("deviceType", deviceType);
    installation.set("deviceOsVersion", deviceOsVersion);
    installation.set("timeZone", timeZone);
    installation.set("localeIdentifier", localeIdentifier);
    installation.set("platform", platform);
    installation.set("ip", ip);
    installation.set("pushStatus", "INSTALLED");

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    if (request.user != undefined) {
      acl.setReadAccess(request.user.id, true);
      acl.setWriteAccess(request.user.id, true);
    }
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    installation.setACL(acl);
    
    return await installation.save(null, { useMasterKey: true }).then((result) => {
      return {
        objectId: result.id,
        installationId: result.get("installationId"),
        appName: result.get("appName"),
        appVersion: result.get("appVersion"),
        appIdentifier: result.get("appIdentifier"),
        channels: result.get("channels"),
        GCMSenderId: result.get("GCMSenderId"),
        deviceToken: result.get("deviceToken"),
        pushType: result.get("pushType"),
        deviceId: result.get("deviceId"),
        deviceBrand: result.get("deviceBrand"),
        deviceModel: result.get("deviceModel"),
        deviceType: result.get("deviceType"),
        deviceOsVersion: result.get("deviceOsVersion"),
        timeZone: result.get("timeZone"),
        localeIdentifier: result.get("localeIdentifier"),
        platform: result.get("platform"),
        ip: result.get("ip"),
        pushStatus: result.get("pushStatus"),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    });
  } else {
    currentInstallation.set("appVersion", appVersion);
    currentInstallation.set("GCMSenderId", GCMSenderId);
    currentInstallation.set("deviceToken", deviceToken);
    currentInstallation.set("deviceOsVersion", deviceOsVersion);
    currentInstallation.set("timeZone", timeZone);
    currentInstallation.set("localeIdentifier", localeIdentifier);
    currentInstallation.set("ip", ip);
    currentInstallation.set("pushStatus", "INSTALLED");

    var newTopics = [];
    const currentTopics = currentInstallation.get("channels");

    if (!currentTopics.includes(appIdentifier)) {
      newTopics.push(appIdentifier);
      newTopics.push(`${appIdentifier}_${appVersion}`);
    }

    userPushTopics.map((topic) => {
      if (!currentTopics.includes(topic)) {
        newTopics.push(topic);
      }
    });

    if (GCMSenderId && deviceToken && newTopics.length > 0) {
      try {
        const topics = await subscribeTopics(GCMSenderId, deviceToken, newTopics);
        newTopics = topics;
      } catch (error) {
        catchError(error);
        newTopics = currentTopics;
      }
      currentInstallation.set("channels", newTopics);
    }

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    if (request.user != undefined) {
      acl.setReadAccess(request.user.id, true);
      acl.setWriteAccess(request.user.id, true);
    }
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    currentInstallation.setACL(acl);

    return await currentInstallation.save(null, { useMasterKey: true }).then((result) => {
      return {
        objectId: result.id,
        installationId: result.get("installationId"),
        appName: result.get("appName"),
        appVersion: result.get("appVersion"),
        appIdentifier: result.get("appIdentifier"),
        channels: result.get("channels"),
        GCMSenderId: result.get("GCMSenderId"),
        deviceToken: result.get("deviceToken"),
        pushType: result.get("pushType"),
        deviceId: result.get("deviceId"),
        deviceBrand: result.get("deviceBrand"),
        deviceModel: result.get("deviceModel"),
        deviceType: result.get("deviceType"),
        deviceOsVersion: result.get("deviceOsVersion"),
        timeZone: result.get("timeZone"),
        localeIdentifier: result.get("localeIdentifier"),
        platform: result.get("platform"),
        ip: result.get("ip"),
        pushStatus: result.get("pushStatus"),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    });
  }
}, {
  fields: [
    'installationId',
    'appName',
    'appVersion',
    'appIdentifier',
    'deviceBrand',
    'deviceModel',
    'deviceType',
    'deviceOsVersion',
    'localeIdentifier',
    'platform',
  ],
});

Parse.Cloud.define('list-user-installations', async (request) => {
  const { params } = request;

  const userId = params.userId;
  const queryUser = new Parse.Query("_User");

  const user = await queryUser.get(userId, { useMasterKey: true });

  const querySessions = new Parse.Query("_Session");
  const queryInstallations = new Parse.Query("_Installation");
  
  querySessions.equalTo("user", user.toPointer());
  queryInstallations.matchesKeyInQuery("installationId", "installationId", querySessions);

  const installations = await queryInstallations.find({ useMasterKey: true });

  return installations;
}, validationAdminRules, {
  fields: ['userId'],
  requireUser: true
});

Parse.Cloud.beforeSave("_Installation", async (request) => {
  const { original, object } = request;

  const GCMSenderId = object.get("GCMSenderId");
  const deviceToken = object.get("deviceToken");
  const appIdentifier = object.get("appIdentifier");
  const appVersion = object.get("appVersion");
  const channels = object.get("channels");

  if (original === undefined || original.get('deviceToken') !== deviceToken) {
    if (GCMSenderId && deviceToken) {
      var pushTopics = [];

      pushTopics.push(appIdentifier);
      pushTopics.push(`${appIdentifier}_${appVersion}`);

      channels.map((topic) => pushTopics.push(topic));

      try {
        const topics = await subscribeTopics(GCMSenderId, deviceToken, pushTopics);
        pushTopics = topics;
      } catch (error) {
        catchError(error);
        pushTopics = [];
      }

      object.set("channels", pushTopics);
    }
  } else {
    if (GCMSenderId && deviceToken) {
      const oldAppVersion = original.get("appVersion");
      if (appVersion !== oldAppVersion) {
        try {
          const oldAppVersionTopic = `${appIdentifier}_${oldAppVersion}`
          await unSubscribeTopics(GCMSenderId, deviceToken, [oldAppVersionTopic]);
        } catch (error) {
          catchError(error);
        }
        try {
          const newAppVersionTopic = `${appIdentifier}_${appVersion}`
          const topics = await subscribeTopics(GCMSenderId, deviceToken, [newAppVersionTopic]);
          object.set("channels", topics);
        } catch (error) {
          catchError(error);
        }
      }
    }
  }
});