const fs = require('fs');

Parse.Cloud.beforeSave("VersionApp", async (request) => {
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

Parse.Cloud.afterDelete("VersionApp", async (request) => {
  const { object } = request;

  const filePath = object.get('filePath');

  if (filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.log(error);
    }
  }
});