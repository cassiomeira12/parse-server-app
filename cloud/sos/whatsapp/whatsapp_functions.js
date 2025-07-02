const { whatsRequest } = require('./whatsapp');

Parse.Cloud.define('available', async (request) => {
  const config = await Parse.Config.get({ useMasterKey: true });

  const baseUrl = config.get("whatsapp_url");
  const token = config.get("whatsapp_bearer_token");

  if (baseUrl === undefined || token == undefined) {
    Parse.Cloud.run(
      "alert-admins",
      {
        "title": "Whatsapp",
        "body": "WhatsApp API not configured",
      },
      { useMasterKey: true }
    );
    return {
      "status": false,
      "message": "WhatsApp API not configured",
    }
  }

  try {
    var response = await whatsRequest('get', 'check-connection-session', null);

    if (response.data['status'] === false) {
      Parse.Cloud.run(
        "alert-admins",
        {
          "title": "Whatsapp",
          "body": error.data === undefined ? "WhatsApp API offline" : error.data['message'],
        },
        { useMasterKey: true }
      );
    }

    return {
      status: response.data['status'],
    };
  } catch (error) {
    Parse.Cloud.run(
      "alert-admins",
      {
        "title": "Whatsapp",
        "body": error.data === undefined ? "WhatsApp API offline" : error.data['message'],
      },
      { useMasterKey: true }
    );
    return {
      "status": false,
      "message": error.data === undefined ? "WhatsApp API offline" : error.data['message'],
    }
  }
}, {
  requireUser: true
});

Parse.Cloud.define('start-whatsapp-session', async (request) => {
  const { params, user } = request;

  const config = await Parse.Config.get({ useMasterKey: true });

  const baseUrl = config.get("whatsapp_url");
  const token = config.get("whatsapp_bearer_token");

  if (baseUrl === undefined || token == undefined) {
    return {
      "status": false,
      "message": "WhatsApp API not configured",
    }
  }

  try {
    var response = await whatsRequest('post', 'start-session', null);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

Parse.Cloud.define('close-whatsapp-session', async (request) => {
  const { params, user } = request;

  const config = await Parse.Config.get({ useMasterKey: true });

  const baseUrl = config.get("whatsapp_url");
  const token = config.get("whatsapp_bearer_token");

  if (baseUrl === undefined || token == undefined) {
    return {
      "status": false,
      "message": "WhatsApp API not configured",
    }
  }

  try {
    var response = await whatsRequest('post', 'close-session', null);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

Parse.Cloud.define('generate-whatsapp-qrcode', async (request) => {
  const { params, user } = request;

  const config = await Parse.Config.get({ useMasterKey: true });

  const baseUrl = config.get("whatsapp_url");
  const token = config.get("whatsapp_bearer_token");

  if (baseUrl === undefined || token == undefined) {
    return {
      "status": false,
      "message": "WhatsApp API not configured",
    }
  }

  try {
    await whatsRequest('post', 'start-session', null);
    var response2 = await whatsRequest('get', 'qrcode-session', null);
    return (response2);
  } catch (error) {
    console.log(error);
    throw error;
    return {
      "status": false,
      "message": "WhatsApp API offline",
    }
  }
});