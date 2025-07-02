const { whatsRequest } = require('./whatsapp/whatsapp');

Parse.Cloud.define('sos', async (request) => {
  const { params, user } = request;

  const choice = params.choice;
  const latitude = params.latitude;
  const longitude = params.longitude;
  const accuracy = params.accuracy;

  const queryUser = new Parse.Query("_User");
  const userToSent = await queryUser.get(user.id, { useMasterKey: true });

  const occurrence = new Parse.Object("Occurrence");
  occurrence.set("user", userToSent.toPointer());
  occurrence.set("choice", choice);
  occurrence.set("latitude", latitude);
  occurrence.set("longitude", longitude);
  occurrence.set("accuracy", accuracy);

  return await occurrence.save(null, { useMasterKey: true }).then((result) => {
    return {
      objectId: result.id,
      choice: result.get("choice"),
      latitude: result.get("latitude"),
      longitude: result.get("longitude"),
      accuracy: result.get("accuracy"),
      contactSent: result.get("contactSent"),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  });
}, {
  fields: ['choice', 'latitude', 'longitude', 'accuracy'],
  requireUser: true
});

Parse.Cloud.define('list-occurrencies', async (request) => {
  const { user } = request;

  const queryOccurrencies = new Parse.Query("Occurrence");
  queryOccurrencies.equalTo("user", user.toPointer());

  const response = await queryOccurrencies.find({ useMasterKey: true });

  return response.map((occurrence) => {
    return {
      objectId: occurrence.id,
      latitude: occurrence.get("latitude"),
      longitude: occurrence.get("longitude"),
      accuracy: occurrence.get("accuracy"),
      contactSent: occurrence.get("contactSent"),
      createdAt: occurrence.createdAt.toISOString(),
      updatedAt: occurrence.updatedAt.toISOString(),
    };
  });
}, {
  requireUser: true
});

Parse.Cloud.define('changeSOSConfig', async (request) => {
  const { params, user } = request;

  const onlyPolice = params.onlyPolice;
  const onlySafetyContacts = params.onlySafetyContacts;

  const query = new Parse.Query("UserSoSConfig");

  query.equalTo('user', user.toPointer());

  const userSOSConfig = await query.first({ useMasterKey: true });

  if (onlyPolice === false && onlySafetyContacts === false) {
    userSOSConfig.set('onlyPolice', false);
    userSOSConfig.set('onlySafetyContacts', true);
  } else {
    userSOSConfig.set('onlyPolice', onlyPolice);
    userSOSConfig.set('onlySafetyContacts', onlySafetyContacts);
  }

  const result = await userSOSConfig.save(null, { useMasterKey: true });

  return {
    'onlyPolice': result.get('onlyPolice'),
    'onlySafetyContacts': result.get('onlySafetyContacts'),
  };
}, {
  fields: ['onlyPolice', 'onlySafetyContacts'],
  requireUser: true
});

Parse.Cloud.beforeSave("Occurrence", async (request) => {
  const { original, object } = request;

  if (original === undefined) {
    const user = object.get("user");
    const queryUser = new Parse.Query("_User");
    queryUser.equalTo("objectId", user.id);
    queryUser.includeAll();

    const userData = await queryUser.first({ useMasterKey: true });

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, false);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);

    const querySafetyContacts = new Parse.Query("SafetyContact");
    querySafetyContacts.equalTo("user", userData.toPointer());
    querySafetyContacts.includeAll();

    const safetyContacts = await querySafetyContacts.findAll({ useMasterKey: true });

    const choice = object.get("choice");

    var phoneNumbers = "";

    if (choice == 2) {
      if (safetyContacts.length == 0) {
        throw "Você precisa adicionar contatos de segurança primeiro";
      } else {
        phoneNumbers = safetyContacts.map((contact) => {
          var phoneNumber = contact.get('phoneNumber');
          return phoneNumber.match(/\d+/g).join('');
        }).join(",");
      }
    }

    if (choice == 1 || choice == 3) {
      const config = await Parse.Config.get({ useMasterKey: true });
      var policyPhoneNumber = config.get("policy_phone_number");
      policyPhoneNumber = policyPhoneNumber.match(/\d+/g).join('');

      phoneNumbers = safetyContacts.map((contact) => {
        var phoneNumber = contact.get('phoneNumber');
        return phoneNumber.match(/\d+/g).join('');
      }).join(",");

      if (phoneNumbers.length == 0) {
        phoneNumbers = policyPhoneNumber;
      } else {
        phoneNumbers = `${phoneNumbers},${policyPhoneNumber}`;
      }
    }

    const userName = userData.get('name');
    const userPhoneNumber = userData.get('phoneNumber');
    const latitude = object.get("latitude");
    const longitude = object.get("longitude");
    const accuracy = object.get("accuracy");

    const date = new Date(new Date().toLocaleString('en', { timeZone: 'America/Sao_Paulo' }))
    const timeNow = dateFormat(date, 'HH:MM"h do dia" dd/mm/yyyy');

    const message = `*MENSAGEM DE EMERGÊNCIA!*
    \nEssa é uma mensagem automática
    \nUm pedido de socorro foi enviado para você
    \n🆘 Nome: *${userName}* \n📞 Telefone: ${userPhoneNumber} \n🕐 Hora: ${timeNow}
    \nVocê recebeu essa mensagem por estar na lista de contatos de segurança
    \nEntre em contato ou procure ajuda!
    \n📍 Abaixo está a localização do GPS com precisão de ${accuracy} metros.
    \nhttps://www.google.com/maps/search/?api=1&query=${latitude},${longitude}
    `;

    const body = {
      "phone": phoneNumbers,
      "message": message,
    };

    // const safetyContactsSent = object.relation('safetyContactsSent');

    try {
      var response = await whatsRequest('post', 'send-message', body);
      if (response.data["status"] == "success") {
        var contacts = Array.from(response.data["response"]);
        var contactSent = contacts.map((contact) => {
          var phoneSent = contact["to"];
          phoneSent = phoneSent.match(/\d+/g).join('');

          // var safetyContact = safetyContacts.find((contact) => {
          //   var phoneNumber = contact.get('phoneNumber');
          //   return phoneNumber.match(/\d+/g).join('') === phoneSent;
          // });

          // if (safetyContact !== undefined) {
          //   safetyContactsSent.add(safetyContact);
          // }

          return phoneSent;
        }).join(",");
        object.set("contactSent", contactSent);
        return;
      }
      throw response.data["message"];
    } catch (error) {
      if (error.data === undefined || error.data["message"] === undefined) {
        throw 'Não foi possível encaminhar mensagem para destinatários';
      }
      throw error.data["message"];
    }
  }
});