Parse.Cloud.define('me', async (request) => {
  const { user } = request;

  return await getUserData(user);
}, {
  requireUser: true,
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
  } catch (error) {}

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