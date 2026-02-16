const express = require('express');
const fileUpload = require('express-fileupload');

const { validationOTPCode } = require('./security/otp/otp');
require('dotenv/config');

const app = express();

const fileUploadConfig = fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 },
  useTempFiles : true,
  tempFileDir : '/tmp/'
});

app.use(fileUploadConfig);

app.all('*', async (req, res, next)  => {
  const regex = /\/parse\/functions\//;
  const endpoint = req.originalUrl;

  const ignoreOptionsRequest = req.method !== 'OPTIONS';
  const isParseEndpoint = regex.test(endpoint);
  const othersEndpoints = [
    '/graphql',
    '/file',
  ].indexOf(endpoint) !== -1;

  if (ignoreOptionsRequest && (isParseEndpoint || othersEndpoints)) {
    const endpointsToIgnore = [
      // Dev test endpoints
      '/parse/functions/generate-key-pair',
      '/parse/functions/generate-otp-secret',
      '/parse/functions/encrypt',
      '/parse/functions/decrypt',
      '/parse/functions/dev-otp-code',
      '/file',
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
  const url = config.get('app_ios_store_url');
  if (url) {
    res.redirect(301, url);
  } else {
    res.status(404).send('Download url not found');
  }
});

app.get('/download_macos_app', async (req, res) => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const url = config.get('app_macos_store_url');
  if (url) {
    res.redirect(301, url);
  } else {
    res.status(404).send('Download url not found');
  }
});

module.exports = app;
