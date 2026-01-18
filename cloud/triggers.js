var dateFormat = require('dateformat');

Parse.Cloud.beforeSave("VersionApp", async (request) => {
  const { original, object, user } = request;
  
  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, false);
    acl.setWriteAccess(user.id, false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});