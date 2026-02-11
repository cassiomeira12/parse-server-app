const validationAdminRules = async request => {
  const { user } = request;

  if (request.master) {
    return;
  }
  // if (!request.user || request.user.id !== 'masterUser') {
  //   throw 'Unauthorized';
  // }

  const queryRole = new Parse.Query("_Role");
  queryRole.equalTo("name", "Admin");
  
  const userQuery = new Parse.Query("_User");
  userQuery.equalTo("objectId", user.id);

  queryRole.matchesQuery("users", userQuery);

  const roles = await queryRole.find({ sessionToken: user.getSessionToken() });

  if (roles) {
    return;
  }

  throw new Parse.Error(403, 'unauthorized');
}

module.exports = { validationAdminRules };