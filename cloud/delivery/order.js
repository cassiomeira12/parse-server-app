const { whatsRequest } = require('../whatsapp/whatsapp');

Parse.Cloud.define('create-order', async (request) => {
  const { params, user } = request;

  const customer = params.customer;
  const phoneNumber = params.phoneNumber;
  const address = params.address;
  const addressGpsLocation = params.addressGpsLocation;
  const items = params.items;
  const note = params.note;
  const paymentChange = params.paymentChange;
  const status = params.statusId;
  const attendant = user;

  const queryPaymentType = new Parse.Query("PaymentType");
  const paymentType = await queryPaymentType.get(params.paymentTypeId, { useMasterKey: true });

  var oderStatus;
  const queryOrderStatus = new Parse.Query("OrderStatus");
  if (status) {
    oderStatus = await queryOrderStatus.get(status, { useMasterKey: true });
  } else {
    queryOrderStatus.equalTo("index", 1);
    oderStatus = await queryOrderStatus.first({ useMasterKey: true });
  }

  const order = new Parse.Object("Order");
  order.set("customer", customer);
  order.set("phoneNumber", phoneNumber);
  order.set("address", address);
  order.set("addressGpsLocation", addressGpsLocation);
  order.set("note", note);
  order.set("paymentType", paymentType);
  order.set("paymentChange", paymentChange);
  order.set("status", oderStatus);
  order.set("attendant", attendant);

  const queryUser = new Parse.Query("_User");
  const userData = await queryUser.get(attendant.id, { useMasterKey: true });
  const company = userData.get("company");
  order.set("company", company);

  if (params.deliveryMan) {
    const queryUser = new Parse.Query("_User");
    const deliveryMan = await queryUser.get(params.deliveryManId, { useMasterKey: true });
    order.set("deliveryMan", deliveryMan);
  }

  const productsOrder = order.relation('items');

  var prodcutOrders = [];

  await Promise.all(items.map(async (item) => {
    const productOrder = new Parse.Object("ProductOrder");
    productOrder.set("name", item.name);
    productOrder.set("description", item.description);
    productOrder.set("price", item.price);
    productOrder.set("discount", item.discount);
    productOrder.set("company", company);
    productOrder.set("quantity", item.quantity);

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
    acl.setRoleReadAccess("DeliveryMan-" + company.id, true);
    acl.setRoleWriteAccess("DeliveryMan-" + company.id, false);
    
    productOrder.setACL(acl);

    var result = await productOrder.save(null, { useMasterKey: true });

    prodcutOrders.push({'node': result.toJSON()});

    productsOrder.add(result);
  }));

  var result = await order.save(null, { useMasterKey: true });

  var resultJson = result.toJSON();

  resultJson['items']['edges'] = prodcutOrders;

  return resultJson;
}, {
  fields: ['customer', 'items', 'paymentTypeId'],
  requireUser: true
});

Parse.Cloud.define('define-deliveryman-order', async (request) => {
  const { params } = request;

  const orderId = params.orderId;
  const deliveryManId = params.deliveryManId;

  const queryOrder = new Parse.Query("Order");
  const order = await queryOrder.get(orderId, { useMasterKey: true });

  const queryUser = new Parse.Query("_User");
  const deliveryMan = await queryUser.get(deliveryManId, { useMasterKey: true });

  order.set("deliveryMan", deliveryMan.toPointer());

  await order.save(null, { useMasterKey: true });

  return deliveryMan.toJSON();
}, {
  fields: ['orderId', 'deliveryManId'],
  requireUser: true
});

Parse.Cloud.define('next-order-status', async (request) => {
  const { params, user } = request;

  const orderId = params.orderId;

  const queryOrder = new Parse.Query("Order");
  queryOrder.include("status");
  const order = await queryOrder.get(orderId, { useMasterKey: true });

  const currentStatus = order.get("status");
  const currentStatusIndex = currentStatus.get("index");

  if (currentStatusIndex === 4 && order.get("deliveryMan") === undefined) {
    throw "deliveryman_has_not_been_defined";
  }

  const queryOrderStatus = new Parse.Query("OrderStatus");
  queryOrderStatus.includeAll();
  queryOrderStatus.equalTo("index", currentStatusIndex + 1);
  const nextStatus = await queryOrderStatus.first({ useMasterKey: true });

  if (nextStatus === undefined) {
    return currentStatus;
  }

  order.set("status", nextStatus);

  await order.save(null, { useMasterKey: true });

  return nextStatus;
}, {
  fields: ['orderId'],
  requireUser: true
});

Parse.Cloud.beforeSave("Order", async (request) => {
  const { original, object } = request;
  
  if (original === undefined) {

    const company = object.get("company")

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
    acl.setRoleReadAccess("DeliveryMan-" + company.id, true);
    acl.setRoleWriteAccess("DeliveryMan-" + company.id, true);
    
    object.setACL(acl);
  }
});