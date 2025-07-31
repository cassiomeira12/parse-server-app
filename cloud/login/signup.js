const { getUserData } = require('../user/user');
const { decryptData } = require('../security/encrypt/encrypt');

Parse.Cloud.define('signup', async (request) => {
  const { params } = request;

  const name = params.name;
  const email = params.email;
  const username = params.username;
  const password = await decryptData(params.password);

  const user = new Parse.Object("_User");
  user.set("name", name);
  user.set("email", email);
  user.set("username", username);
  user.set("password", password);

  await user.save(null, { useMasterKey: true });

  const ip = request.ip.replace('::ffff:','');
  const installationId = `${ip} ${request.installationId}`.toLowerCase();

  const userLogged = await Parse.User.logIn(username, password, { installationId: installationId });

  return await getUserData(userLogged);
}, {
  fields: ['name', 'email', 'username', 'password'],
  requireUser: false,
});
