const { catchError } = require('../crashlytics');

Parse.Cloud.define('me', async (request) => {
  const { user } = request;

  return await getUserData(user);
}, {
  requireUser: true,
});

Parse.Cloud.define('deleteAccount', async (request) => {
  const { params, user } = request;

  const reason = params.reason;

  const userQuery = new Parse.Query("_User");
  userQuery.includeAll();
  const userData = await userQuery.get(user.id, { useMasterKey: true });

  await userData.destroy({ useMasterKey: true });

  const userDeleted = new Parse.Object("UserDeleted");
  userDeleted.set("userId", userData.id);
  userDeleted.set("name", userData.get("name"));
  userDeleted.set("username", userData.get("username"));
  userDeleted.set("email", userData.get("email"));
  userDeleted.set("emailVerified", userData.get("emailVerified"));
  userDeleted.set("locale", userData.get("locale"));
  userDeleted.set("reason", reason);

  await userDeleted.save(null, { useMasterKey: true });
}, {
  fields: ['reason'],
  requireUser: true,
});

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

const getUserData = async (user) => {
  const userQuery = new Parse.Query("_User");
  userQuery.includeAll();

  const userData = await userQuery.get(user.id, { useMasterKey: true });

  const name = userData.get("name");
  const avatarUrl = `https://ui-avatars.com/api/?format=png&name=${name.replace(" ", "+")}`;

  const userJson = userData.toJSON();

  delete userJson['ACL'];
  
  userJson['avatarUrl'] = userJson['avatarUrl'] ?? avatarUrl;
  userJson['createdAt'] = userData.createdAt.toISOString();
  userJson['updatedAt'] = userData.updatedAt.toISOString();
  userJson['sessionToken'] = user.get("sessionToken");
  
  try {
    const permissionsRoles =  await getUserPermissions(userData);
    userJson['permissions'] = permissionsRoles;
  } catch (error) {
    catchError(error);
  }

  return userJson;
}

const getUserPermissions = async (user) => {
  const queryRole = new Parse.Query("_Role");

  const userQuery = new Parse.Query("_User");
  userQuery.equalTo("objectId", user.id);

  queryRole.matchesQuery("users", userQuery);

  const roles = await queryRole.find({ useMasterKey: true });

  return roles.map((role) => {
    return role.get('name');
  });
}

module.exports = { getUserData };