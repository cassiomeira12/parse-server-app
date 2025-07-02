const createUserSOSConfig = async (userLogged) => {
  const userSOSConfig = new Parse.Object("UserSoSConfig");
  userSOSConfig.set("user", userLogged.toPointer());
  await userSOSConfig.save(null, { sessionToken: userLogged.getSessionToken() });
}

const getUserSoSConfig = async (user) => {
  const query = new Parse.Query("UserSoSConfig");

  query.equalTo('user', user.toPointer());

  const userSOSConfig = await query.first({ useMasterKey: true });

  return {
    'onlyPolice': userSOSConfig.get('onlyPolice'),
    'onlySafetyContacts': userSOSConfig.get('onlySafetyContacts'),
  };
}

const deleteUserSOSConfigs = async (object) => {
  const queryUserSoSConfig = new Parse.Query("UserSoSConfig");
  queryUserSoSConfig.equalTo("user", object.toPointer());
  const userSoSConfigs = await queryUserSoSConfig.find({ useMasterKey: true });
  userSoSConfigs.forEach(object => {
    object.destroy({ useMasterKey: true });
  });
}

Parse.Cloud.beforeSave("UserSoSConfig", async (request) => {
  const { original, object, user } = request;
  
  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

module.exports = { createUserSOSConfig, getUserSoSConfig, deleteUserSOSConfigs };