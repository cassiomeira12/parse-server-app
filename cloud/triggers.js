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

Parse.Cloud.beforeDelete("VersionApp", async (request) => {
  const { object } = request;

  const nameVersion = object.get('nameVersion');
  const downloadUrl = object.get('downloadUrl');
  const splitUrl = downloadUrl.split('/');
  const fileName = splitUrl[splitUrl.length - 1];

  var filePath = `./public/releases/${nameVersion}/${fileName}`;

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.log(error);
  }
});