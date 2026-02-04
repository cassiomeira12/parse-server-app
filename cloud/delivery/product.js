Parse.Cloud.define('create-product', async (request) => {
  const { params, user } = request;

  const name = params.name;
  const description = params.description;
  const price = params.price;
  const discount = params.discount;
  const statusId = params.statusId;

  const queryProductStatus = new Parse.Query("ProductStatus");
  const productStatus = await queryProductStatus.get(statusId, { useMasterKey: true });

  const queryUser = new Parse.Query("_User");
  const userData = await queryUser.get(user.id, { useMasterKey: true });
  const company = userData.get("company");

  const product = new Parse.Object("Product");
  product.set("name", name);
  product.set("description", description);
  product.set("price", price);
  product.set("discount", discount);
  product.set('status', productStatus.toPointer());
  product.set("company", company);

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);

  // Company Admin ACL
  acl.setRoleReadAccess("Admin-" + company.id, true);
  acl.setRoleWriteAccess("Admin-" + company.id, true);

  // Company Attendant ACL
  acl.setRoleReadAccess("Attendant-" + company.id, true);
  acl.setRoleWriteAccess("Attendant-" + company.id, true);

  // Company DeliveryMan ACL
  acl.setRoleReadAccess("DeliveryMan-" + company.id, false);
  acl.setRoleWriteAccess("DeliveryMan-" + company.id, false);
    
  product.setACL(acl);

  var result = await product.save(null, { useMasterKey: true });

  return {
    'objectId': result.id,
    'name': result.get('name'),
    'description': result.get('description'),
    'price': result.get('price'),
    'discount': result.get('discount'),
    'status': {
      'objectId': productStatus.id,
      'name': productStatus.get('name'),
      'enabled': productStatus.get('enabled'),
      'showProduct': productStatus.get('showProduct'),
    }
  };
}, {
  fields: ['name', 'description', 'price', 'discount', 'statusId'],
  requireUser: true
});

Parse.Cloud.define('update-product', async (request) => {
  const { params } = request;

  const productId = params.productId;
  const name = params.name;
  const description = params.description;
  const price = params.price;
  const discount = params.discount;
  const statusId = params.statusId;

  const queryProduct = new Parse.Query("Product");
  const product = await queryProduct.get(productId, { useMasterKey: true });
  
  product.set('name', name);
  product.set('description', description);
  product.set('price', price);
  product.set('discount', discount);

  const queryProductStatus = new Parse.Query("ProductStatus");
  const productStatus = await queryProductStatus.get(statusId, { useMasterKey: true });

  product.set('status', productStatus.toPointer());

  const result = await product.save(null, { useMasterKey: true });

  return {
    'objectId': result.id,
    'name': result.get('name'),
    'description': result.get('description'),
    'price': result.get('price'),
    'discount': result.get('discount'),
    'status': {
      'objectId': productStatus.id,
      'name': productStatus.get('name'),
      'enabled': productStatus.get('enabled'),
      'showProduct': productStatus.get('showProduct'),
    }
  };
}, {
  fields: ['productId', 'name', 'description', 'price', 'discount', 'statusId'],
  requireUser: true
});