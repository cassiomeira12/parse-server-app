const { whatsRequest } = require('./whatsapp/whatsapp');

Parse.Cloud.define('add-safety-contact', async (request) => {
  const { params, user } = request;

  const name = params.name;
  const phoneNumber = params.phoneNumber;
  const sendMessage = params.sendMessage;

  const safetyContact = new Parse.Object("SafetyContact");
  safetyContact.set("user", user.toPointer());
  safetyContact.set("name", name);
  safetyContact.set("phoneNumber", phoneNumber);
  safetyContact.set("sendMessage", sendMessage);

  return await safetyContact.save(null, { sessionToken: user.getSessionToken() }).then((result) => {
    const name = result.get("name");
    const avatarUrl = `https://ui-avatars.com/api/?format=png&name=${name.replace(" ", "+")}`;

    return {
      objectId: result.id,
      name: result.get("name"),
      phoneNumber: result.get("phoneNumber"),
      avatarUrl: result.get("avatarUrl") ?? avatarUrl,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  });
}, {
  fields: ['name', 'phoneNumber', 'sendMessage'],
  requireUser: true
});

Parse.Cloud.define('delete-safety-contact', async (request) => {
  const { params, user } = request;

  const objectId = params.objectId;

  const query = new Parse.Query("SafetyContact");
  query.equalTo("objectId", objectId);
  query.equalTo('user', user.toPointer());

  try {
    const result = await query.first({ useMasterKey: true });
    await result.destroy({ useMasterKey: true });
    return true;
  } catch (exception) {
    return false;
  }
}, {
  fields: ['objectId'],
  requireUser: true
});

Parse.Cloud.define('list-safety-contact', async (request) => {
  const { params, user } = request;

  const page = params.page ?? 0;
  const itemsPerPage = params.itemsPerPage ?? 10;
  if (itemsPerPage > 10) throw "Limite maximo por página 10";

  const query = new Parse.Query("SafetyContact");
  query.equalTo("user", user.toPointer());
  query.addAscending("name");
  query.skip(page * itemsPerPage);
  query.limit(itemsPerPage);
  query.includeAll();

  const response = await query.find({ useMasterKey: true });

  return response.map((result) => {
    const name = result.get("name");
    const avatarUrl = `https://ui-avatars.com/api/?format=png&name=${name.replace(" ", "+")}`;

    return {
      objectId: result.id,
      name: name,
      phoneNumber: result.get("phoneNumber"),
      avatarUrl: result.get("avatarUrl") ?? avatarUrl,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  });
}, {
  fields: ['page'],
  requireUser: true
});

Parse.Cloud.beforeSave("SafetyContact", async (request) => {
  const { original, object, user } = request;

  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);

    if (object.get("sendMessage") === false) {
      object.unset("sendMessage");
      return;
    }

    const queryUser = new Parse.Query("_User");
    const userData = await queryUser.get(user.id, { useMasterKey: true });  

    var phoneNumber = object.get('phoneNumber');
    phoneNumber = phoneNumber.match(/\d+/g).join('');

    const message = `*Aplicativo SOS Vida*
    \nOlá, ${object.get('name')}
    \n*${userData.get('name')}*, ${userData.get('phoneNumber')}, adicionou você na lista de contatos de segurança.
    \nIsso permitirá você receber mensagens de emergência com a localização de *${userData.get('name')}*.
    `;

    const body = {
      "phone": phoneNumber,
      "message": message,
    };

    try {
      var response = await whatsRequest('post', 'send-message', body);

      const status = response.data['status'];
      const msgResponse = response.data['response'];

      //const firstMsg = msgResponse[0];

      //const chatId = firstMsg['chatId'].match(/\d+/g).join('');

      // const imageUrl = await getWhatsAppContactProfile(chatId);
      // object.set("avatarUrl", imageUrl);
      object.unset("sendMessage");

      return status;
    } catch (error) {
      if (error.data["message"] === undefined) {
        throw 'Não foi possível encaminhar mensagem para o destinatário';
      }
      throw error.data["message"];
    }
  }
});
