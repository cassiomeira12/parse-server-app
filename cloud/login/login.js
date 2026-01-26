const { getUserData, unSubscribeAllUserTopics } = require('../user/user');
const { decryptData } = require('../security/encrypt/encrypt');

Parse.Cloud.define('login', async (request) => {
  const { params } = request;

  const username = params.username;
  const password = await decryptData(params.password);

  const installationId = request.installationId;

  return await login(username, password, installationId);
}, {
  fields: ['username', 'password'],
  requireUser: false
});

Parse.Cloud.define("change-password", async (request) => {
  const { params, user } = request;

  const username = params.username;
  const password = await decryptData(params.password);
  const newPassword = await decryptData(params.newPassword);

  const installationId = request.installationId;

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

// Parse.Cloud.beforeLogin(async (request) => {
//   const { object: user }  = request;

//   // Check if user account blocked / suspended
// });

Parse.Cloud.afterLogout(async (request) => {
  const { object: session, user }  = request;

  const installationId = session.get('installationId');
  const userTopics = user.get('pushTopics');

  unSubscribeAllUserTopics(userTopics, installationId);
});

const login = async (username, password, installationId) => {
  const user = await Parse.User.logIn(username, password, { installationId: installationId });
  return await getUserData(user);
}