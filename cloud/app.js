const express = require('express');
const { validationOTPCode } = require('./security/otp/otp');
require('dotenv/config');

const app = express();

app.all('*', async (req, res, next)  => {
  const regex = /\/parse\/functions\//;
  const endpoint = req.originalUrl;
  const ignoreOptionsRequest = req.method !== 'OPTIONS';
  if (ignoreOptionsRequest && regex.test(endpoint)) {
    const endpointsToIgnore = [
      // Dev test endpoints
      '/parse/functions/generate-key-pair',
      '/parse/functions/encrypt',
      '/parse/functions/decrypt',
      '/parse/functions/dev-otp-code',
    ];
    if (endpointsToIgnore.indexOf(endpoint) === -1) {
      try {
        await validationOTPCode(req.headers);
      } catch (error) {
        return res.status(400).send({'error': error});
      }
    }
  }
  next();
});

app.get('/hello', (req, res) => {
  res.send("Parse Server Cloud Code");
});

app.get('/download_android_app', async (req, res) => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const url = config.get('app_android_store_url');
  if (url) {
    res.redirect(301, url);
  } else {
    res.status(404).send('Download url not found');
  }
});

app.get('/download_ios_app', async (req, res) => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const url = config.get('app_apple_store_url');
  if (url) {
    res.redirect(301, url);
  } else {
    res.status(404).send('Download url not found');
  }
});

module.exports = app;
