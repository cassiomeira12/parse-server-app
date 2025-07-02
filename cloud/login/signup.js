const { getUserData } = require('../user/user');
const { decryptData } = require('../security/encrypt/encrypt');
const { createUserSOSConfig } = require('../sos/user_sos_config');

Parse.Cloud.define('signup', async (request) => {
  const { params, headers } = request;

  const name = params.name;
  const email = params.email;
  const username = params.username;
  const password = await decryptData(params.password);

  const user = new Parse.Object("_User");
  user.set("name", name);
  user.set("email", email);
  user.set("username", username);
  user.set("password", password);
  user.set("pushTopics", []);

  const userCreated = await user.save(null, { useMasterKey: true });
  const userId = userCreated.id;
  userCreated.set("pushTopics", [userId]);
  await userCreated.save(null, { useMasterKey: true });

  const installationId = request.installationId;

  const userLogged = await Parse.User.logIn(username, password, { installationId: installationId });

  await createUserSOSConfig(userLogged);

  return await getUserData(userLogged);
}, {
  fields: ['name', 'email', 'username', 'password'],
  requireUser: false,
});
