async function whatsRequest(method, endpoint, body) {
  const getConfig = await Parse.Config.get({ useMasterKey: true });

  const token = getConfig.get("whatsapp_bearer_token");

  const whatsapp_url = getConfig.get("whatsapp_url");
  const whatsappServer1 = getConfig.get("whatsapp_server_1");
  // const whatsappServer2 = getConfig.get("whatsapp_server_2");

  var base_url = whatsapp_url;

  const defaultServer = await checkWhatsAppServer(base_url, token);
  console.log(`Default WhatsApp Server [${defaultServer}]`);
  if (defaultServer === true) {
    base_url = whatsapp_url;
  }

  var server1 = defaultServer;

  if (defaultServer === false) {
    var server1 = await checkWhatsAppServer(whatsappServer1, token);
    console.log(`WhatsApp Server 1 [${server1}]`);
    if (server1 === true) {
      base_url = whatsappServer1;
      console.log(`Set Default WhatsApp Server 1`);
      await Parse.Config.save(
        {
          whatsapp_url: base_url,
        },
        { useMasterKey: true }
      );
    }
  }
  
  var server2 = server1;

  // if (server1 === false) {
  //   var server2 = await checkWhatsAppServer(whatsappServer2, token);
  //   console.log(`WhatsApp Server 2 [${server2}]`);
  //   if (server2 === true) {
  //     base_url = whatsappServer2;
  //     console.log(`Set Default WhatsApp Server 2`);
  //     await Parse.Config.save(
  //       {
  //         whatsapp_url: base_url,
  //       },
  //       { useMasterKey: true }
  //     );
  //   }
  // }

  return Parse.Cloud.httpRequest({
    method: method,
    url: `${base_url}/${endpoint}`,
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: body,
  });
}

const checkWhatsAppServer = async (serverUrl, token) => {
  try {
    var response = await Parse.Cloud.httpRequest({
      method: 'get',
      url: `${serverUrl}/check-connection-session`,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const status = response.data['status'];
    if (status === false) {
      return await startWhatsAppSession(serverUrl, token, true);
    }
    return response.data['status'];
  } catch (error) {
    console.log(`WhatsApp Server ${serverUrl} [OFF]`);
    return false;
  }
}

const startWhatsAppSession = async (serverUrl, token, tryAgain) => {
  try {
    console.log(`Start WhatsApp Server ${serverUrl}`);

    await Parse.Cloud.httpRequest({
      method: 'post',
      url: `${serverUrl}/start-session`,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 6000));

    var response = await Parse.Cloud.httpRequest({
      method: 'get',
      url: `${serverUrl}/check-connection-session`,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const checkSession = response.data['status'];
    
    console.log(`Start WhatsApp Server [${checkSession}]`);

    if (tryAgain === true) {
      return await closeWhatsAppSession(serverUrl, token);
    }

    return checkSession;
  } catch (error) {
    return false;
  }
}

const closeWhatsAppSession = async (serverUrl, token) => {
  try {
    console.log(`Close WhatsApp Server ${serverUrl}`);

    await Parse.Cloud.httpRequest({
      method: 'post',
      url: `${serverUrl}/close-session`,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 6000));

    return await startWhatsAppSession(serverUrl, token, false);
  } catch (error) {
    return false;
  }
}

const getWhatsAppContactProfile = async (chatId) => {
  const getConfig = await Parse.Config.get({ useMasterKey: true });

  const token = getConfig.get("whatsapp_bearer_token");

  const whatsapp_url = getConfig.get("whatsapp_url");

  try {
    const data = await getWhatsAppChat(whatsapp_url, chatId, token);

    const contact = data['contact'];
    const profilePicThumbObj = contact['profilePicThumbObj'];
    const imgFull = profilePicThumbObj['imgFull'];

    return imgFull;
  } catch (error) {
    console.log(`WhatsApp Server ${serverUrl} [OFF]`);
    return false;
  }
}

const getWhatsAppChat = async (serverUrl, chatId, token) => {
  try {
    var response = await Parse.Cloud.httpRequest({
      method: 'get',
      url: `${serverUrl}/chat-by-id/${chatId}`,
      params: {
        'isGroup': false,
      },
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    const data = response.data;

    return data;
  } catch (error) {
    console.log(`WhatsApp Server ${serverUrl} [OFF]`);
    return false;
  }
}

module.exports = { whatsRequest, getWhatsAppContactProfile };