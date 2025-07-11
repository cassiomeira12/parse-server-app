Parse.Cloud.beforeSave("Credential", async (request) => {
  const { original, object, user } = request;
  
  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    
    object.setACL(acl);
  }
});

const deleteUserCredentials = async (user) => {
  const query = new Parse.Query("Credential");
  const credentials = await query.findAll({ sessionToken: user.getSessionToken() });
  credentials.forEach(object => {
    object.destroy({ useMasterKey: true });
  });
}

module.exports = { deleteUserCredentials };