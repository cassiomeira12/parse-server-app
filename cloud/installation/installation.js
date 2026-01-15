const { validationAdminRules } = require('../roles/validation_roles');
const { subscribeTopics } = require('../push_notification/push_notification');

Parse.Cloud.define('installation', async (request) => {
  const { params, headers } = request;

  const deviceId = request.installationId;
  const deviceToken = params.deviceToken;
  const GCMSenderId = params.GCMSenderId;
  const appIdentifier = params.appIdentifier;
  const deviceBrand = params.deviceBrand;
  const deviceType = params.deviceType;
  const deviceOsVersion = params.deviceOsVersion;
  const appName = params.appName;
  const channels = params.channels;
  const appVersion = params.appVersion;
  const timeZone = params.timeZone;
  const localeIdentifier = params.localeIdentifier;
  const platform = params.platform;

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

  var pushTopicsSubscribed = [];
  const pushTopics = user.get('pushTopics');
  if (GCMSenderId && deviceToken && pushTopics.length > 0) {
    try {
      const topics = await subscribeTopics(GCMSenderId, deviceToken, pushTopics);
      pushTopicsSubscribed = topics;
    } catch (error) {
      pushTopicsSubscribed = channels;
    }
  }

  if (currentInstallation === undefined) {
    const installation = new Parse.Object("_Installation");
    installation.set("installationId", installationId);
    installation.set("ip", ip);
    installation.set("deviceId", deviceId);
    installation.set("deviceToken", deviceToken);
    installation.set("GCMSenderId", GCMSenderId);
    installation.set("appIdentifier", appIdentifier);
    installation.set("deviceBrand", deviceBrand);
    installation.set("deviceType", deviceType);
    installation.set("deviceOsVersion", deviceOsVersion);
    installation.set("appName", appName);
    installation.set("channels", pushTopicsSubscribed);
    installation.set("appVersion", appVersion);
    installation.set("timeZone", timeZone);
    installation.set("localeIdentifier", localeIdentifier);
    installation.set("pushStatus", "INSTALLED");
    installation.set("platform", platform);

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    installation.setACL(acl);

    return await installation.save(null, { useMasterKey: true }).then((result) => {
      return {
        objectId: result.id,
        installationId: result.get("installationId"),
        ip: result.get("ip"),
        deviceId: result.get("deviceId"),
        deviceToken: result.get("deviceToken"),
        GCMSenderId: result.get("GCMSenderId"),
        appIdentifier: result.get("appIdentifier"),
        deviceBrand: result.get("deviceBrand"),
        deviceType: result.get("deviceType"),
        deviceOsVersion: result.get("deviceOsVersion"),
        appName: result.get("appName"),
        channels: result.get("channels"),
        appVersion: result.get("appVersion"),
        timeZone: result.get("timeZone"),
        localeIdentifier: result.get("localeIdentifier"),
        pushStatus: result.get("pushStatus"),
        platform: result.get("platform"),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    });
  } else {
    currentInstallation.set("deviceToken", deviceToken);
    currentInstallation.set("deviceOsVersion", deviceOsVersion);
    currentInstallation.set("channels", pushTopicsSubscribed);
    currentInstallation.set("appVersion", appVersion);
    currentInstallation.set("timeZone", timeZone);
    currentInstallation.set("localeIdentifier", localeIdentifier);
    currentInstallation.set("pushStatus", "INSTALLED");

    return await currentInstallation.save(null, { useMasterKey: true }).then((result) => {
      return {
        objectId: result.id,
        installationId: result.get("installationId"),
        ip: result.get("ip"),
        deviceId: result.get("deviceId"),
        deviceToken: result.get("deviceToken"),
        GCMSenderId: result.get("GCMSenderId"),
        appIdentifier: result.get("appIdentifier"),
        deviceBrand: result.get("deviceBrand"),
        deviceType: result.get("deviceType"),
        deviceOsVersion: result.get("deviceOsVersion"),
        appName: result.get("appName"),
        channels: result.get("channels"),
        appVersion: result.get("appVersion"),
        timeZone: result.get("timeZone"),
        localeIdentifier: result.get("localeIdentifier"),
        pushStatus: result.get("pushStatus"),
        platform: result.get("platform"),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    });
  }
}, {
  fields: [
    'appIdentifier',
    'deviceBrand',
    'deviceType',
    'deviceOsVersion',
    'appName',
    'channels',
    'appVersion',
    'localeIdentifier',
    'platform',
  ],
  requireUser: true
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
