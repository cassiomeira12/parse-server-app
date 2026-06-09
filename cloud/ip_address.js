const axios = require('axios');

Parse.Cloud.define('ip-address', async (request) => {
  const { params, headers } = request;

  var ip = params.ip;

  if (ip == undefined) {
    ip = (headers['ip'] ?? request.ip).replace('::ffff:','');
  }

  try { 
    const response = await axios({
      method: 'get',
      url: `http://ip-api.com/json/${ip}`,
    });

    const data = response.data;

    return data;
  } catch (error) {
    catchError(error);
    throw error;
  }
}, {
  requireUser: false
});