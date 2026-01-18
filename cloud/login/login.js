const { getUserData } = require('../user/user');
const { decryptData } = require('../security/encrypt/encrypt');
const { unSubscribeTopics } = require('../push_notification/push_notification');
const { catchError } = require('../crashlytics');

Parse.Cloud.define('login', async (request) => {
  const { params, headers } = request;

  const username = params.username;
  const password = await decryptData(params.password);

  const ip = (headers['ip'] ?? request.ip).replace('::ffff:','');
  const installationId = `${ip} ${request.installationId}`.toLowerCase();

  return await login(username, password, installationId);
}, {
  fields: ['username', 'password'],
  requireUser: false
});

Parse.Cloud.define("change-password", async (request) => {
  const { params, user, headers } = request;

  const username = params.username;
  const password = await decryptData(params.password);
  const newPassword = await decryptData(params.newPassword);

  const ip = (headers['ip'] ?? request.ip).replace('::ffff:','');
  const installationId = `${ip} ${request.installationId}`.toLowerCase();

  const userLogged = await Parse.User.logIn(username, password, { installationId: installationId });

  if (user.id != userLogged.id) {
    throw 'Usuário inválido';
  }

  userLogged.set("password", newPassword);

  await userLogged.save(null, { sessionToken: userLogged.getSessionToken() });

  const querySessions = new Parse.Query("_Session");
  querySessions.equalTo("user", user.toPointer());

  const sessions = await querySessions.find({ useMasterKey: true });

  sessions.forEach(object => {
    object.destroy({ useMasterKey: true });
  });

  return await login(username, newPassword, installationId);
}, {
  fields: ['username', 'password', 'newPassword'],
  requireUser: true,
});

// Parse.Cloud.beforePasswordResetRequest(request => {
//   if (request.object.get('banned')) {
//     throw new Parse.Error(Parse.Error.EMAIL_NOT_FOUND, 'User is banned.');
//   }
// });

// Parse.Cloud.beforeLogin(async request => {
//   const { object: user }  = request;

//   console.log(request);
// });

Parse.Cloud.afterLogout(async (request) => {
  const { object: session, user }  = request;

  const installationId = session.get('installationId');
  const userTopics = user.get('pushTopics');

  const queryInstallation = new Parse.Query("_Installation");
  queryInstallation.equalTo("installationId", installationId);

  const installation = await queryInstallation.first({ useMasterKey: true });

  if (installation == undefined) {
    return;
  }

  const GCMSenderId = installation.get("GCMSenderId");
  const deviceToken = installation.get("deviceToken");

  if (GCMSenderId && deviceToken) {
    try {
      const channels = await unSubscribeTopics(GCMSenderId, deviceToken, userTopics);
      installation.set('channels', channels);
      installation.save(null, { useMasterKey: true });
      return true;
    } catch (error) {
      catchError(error);
      if (error.response.status === 404 || error.response["statusText"] === 'Not Found') {
        installation.set('pushStatus', 'UNINSTALLED');
        installation.set('channels', []);
        installation.save(null, { useMasterKey: true });
      }
      return false;
    }
  }
});


const login = async (username, password, installationId) => {
  const user = await Parse.User.logIn(username, password, { installationId: installationId });
  return await getUserData(user);
}