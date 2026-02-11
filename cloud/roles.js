const { validationAdminRules } = require('./roles/validation_roles');

Parse.Cloud.define('check-roles', async (request) => {
  const { user } = request;

  const queryRole = new Parse.Query("_Role");

  const userQuery = new Parse.Query("_User");
  userQuery.equalTo("objectId", user.id);

  queryRole.matchesQuery("users", userQuery);

  const roles = await queryRole.find({ sessionToken: user.getSessionToken() });

  return roles.map((role) => {
    return {
      'name': role.get('name'),
    };
  });
}, validationAdminRules, {
  requireUser: true,
});

Parse.Cloud.define('add-admin-user', async (request) => {
  const { params, user } = request;

  const queryRole = new Parse.Query("_Role");
  queryRole.equalTo('name', 'Admin');

  const adminRole = await queryRole.first({ sessionToken: user.getSessionToken() });

  if (adminRole === undefined) {
    throw new Parse.Error(403, 'Permission denied for this action');
  }

  const queryUser = new Parse.Query("_User");
  const userToAdd = await queryUser.get(params.userId, { useMasterKey: true });

  const users = adminRole.relation('users');
  users.add(userToAdd);

  return await adminRole.save(null, { useMasterKey: true });
}, {
  fields: ['userId'],
  requireUser: true
});