const { whatsRequest, getWhatsAppContactProfile } = require('./whatsapp');

Parse.Cloud.define('send-whatsapp-code', async (request) => {
  const { params, user } = request;

  var phoneNumber = params.phoneNumber;
  phoneNumber = phoneNumber.match(/\d+/g).join('');
  var code = params.code;

  const message = `*Bem-vindo ao SOS Vida!*
  \nSua conta foi criada com sucesso. Para garantir a segurança e ativar sua conta, por favor, insira o código de verificação a seguir no campo apropriado do aplicativo:
  \nCódigo de Verificação: ${code}
  \nEstamos felizes por você ter escolhido o SOS Vida para cuidar da sua segurança e bem-estar. Explore o aplicativo e descubra como podemos ajudar você a estar sempre protegido.
  \nAtenciosamente,\nEquipe SOS Vida
  `;

  const body = {
    "phone": phoneNumber,
    "message": message,
  };

  const queryUser = new Parse.Query("_User");
  const userToUpdate = await queryUser.get(user.id, { useMasterKey: true });

  try {
    var response = await whatsRequest('post', 'send-message', body);

    const status = response.data["status"];
    // const msgResponse = response.data['response'];

    // const firstMsg = msgResponse[0];

    // const chatId = firstMsg['chatId'].match(/\d+/g).join('');

    // const imageUrl = await getWhatsAppContactProfile(chatId);

    // if (imageUrl) {
    //   userToUpdate.set("avatarUrl", imageUrl);
    //   userToUpdate.save(null, { sessionToken: user.getSessionToken() });
    // }
    
    return status;
  } catch (error) {
    if (error.data["message"] === undefined) {
      throw 'Não foi possível encaminhar mensagem para destinatários';
    }
    throw error.data["message"];
  }
}, {
  fields: ['phoneNumber', 'code'],
  requireUser: true
});