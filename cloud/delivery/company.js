Parse.Cloud.define('create-company', async (request) => {
  const { params, user } = request;

  const name = params.name;

  const company = new Parse.Object("Company");
  company.set("name", name);

  var result = await company.save(null, { useMasterKey: true });

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  acl.setRoleReadAccess("Admin", true);
  acl.setRoleWriteAccess("Admin", true);

  const adminRole = new Parse.Object("_Role");
  adminRole.set("name", "Admin-" + result.id);
  adminRole.setACL(acl);
  adminRole.save(null, { useMasterKey: true });

  const attendantRole = new Parse.Object("_Role");
  attendantRole.set("name", "Attendant-" + result.id);
  attendantRole.setACL(acl);
  attendantRole.save(null, { useMasterKey: true });

  const deliveryManRole = new Parse.Object("_Role");
  deliveryManRole.set("name", "DeliveryMan-" + result.id);
  deliveryManRole.setACL(acl);
  deliveryManRole.save(null, { useMasterKey: true });

  return result;
}, {
  fields: ['name'],
  requireUser: true
});

Parse.Cloud.define('list-attendant', async (request) => {
  const { user } = request;

  const queryUser = new Parse.Query("_User");
  const userData = await queryUser.get(user.id, { useMasterKey: true });

  const companyId = userData.get("company").id;

  const queryRole = new Parse.Query("_Role");
  queryRole.equalTo("name", `Attendant-${companyId}`);

  const role = await queryRole.first({ useMasterKey: true });

  const queryRelationUser = role.get("users").query();

  return await queryRelationUser.find({ useMasterKey: true });
}, {
  requireUser: true
});

Parse.Cloud.define('list-deliveryman', async (request) => {
  const { user } = request;

  const queryUser = new Parse.Query("_User");
  const userData = await queryUser.get(user.id, { useMasterKey: true });

  const companyId = userData.get("company").id;

  const queryRole = new Parse.Query("_Role");
  queryRole.equalTo("name", `DeliveryMan-${companyId}`);

  const role = await queryRole.first({ useMasterKey: true });

  const queryRelationUser = role.get("users").query();

  return await queryRelationUser.find({ useMasterKey: true });
}, {
  requireUser: true
});