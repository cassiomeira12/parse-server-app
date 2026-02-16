const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');

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
  ].indexOf(endpoint) === -1;

  if (ignoreOptionsRequest && (isParseEndpoint || othersEndpoints)) {
    const endpointsToIgnore = [
      // Dev test endpoints
      '/parse/functions/generate-key-pair',
      '/parse/functions/generate-otp-secret',
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
    const link = `${process.env.PUBLIC_SERVER_URL}/${url}`;
    res.redirect(301, link);
  } else {
    res.status(404).send('Download url not found');
  }
});

app.get('/download_ios_app', async (req, res) => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const url = config.get('app_ios_store_url');
  if (url) {
    const link = `${process.env.PUBLIC_SERVER_URL}/${url}`;
    res.redirect(301, link);
  } else {
    res.status(404).send('Download url not found');
  }
});

app.get('/download_macos_app', async (req, res) => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const url = config.get('app_macos_store_url');
  if (url) {
    const link = `${process.env.PUBLIC_SERVER_URL}/${url}`;
    res.redirect(301, link);
  } else {
    res.status(404).send('Download url not found');
  }
});

app.post('/file', async function(req, res) {
  if (!req.files || !req.files.file) {
    return res.status(422).send('No files were uploaded');
  }

  const sessionToken = req.headers['x-parse-session-token'] ?? '';

  const body = req.body;
  const package = body.package;
  const platform = body.platform;
  const nameVersion = body.nameVersion;
  const buildVersion = body.buildVersion;

  const uploadedFile = req.files.file;
  const fileName = uploadedFile.name;
  const downloadUrl = `public/releases/${nameVersion}/${fileName}`;

  var savePathDir = `./public/releases/${nameVersion}/`;
  if (!fs.existsSync(savePathDir)) {
    fs.mkdirSync(savePathDir, { recursive: true });
  }

  if (fs.existsSync(savePathDir + fileName)) {
    return res.status(500).send(`${fileName} already exist`);
  }

  const versionApp = new Parse.Object("VersionApp");
  versionApp.set("package", package);
  versionApp.set("platform", platform);
  versionApp.set("nameVersion", nameVersion);
  versionApp.set("buildVersion", parseInt(buildVersion));
  versionApp.set("downloadUrl", downloadUrl);

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  acl.setRoleReadAccess("Admin", true);
  acl.setRoleWriteAccess("Admin", true);
  
  versionApp.setACL(acl);
  
  try {
    const result = await versionApp.save(null, { sessionToken: sessionToken });
    uploadedFile.mv(savePathDir + fileName, function(err) {
      if (err) {
        return res.status(500).send(err);
      }
    });

    const queryVersionApp = new Parse.Query('VersionApp');
    queryVersionApp.equalTo('platform', platform);
    queryVersionApp.descending('buildVersion');

    const latestVersionApp = await queryVersionApp.first({ useMasterKey: true });

    const appStoreUrl = `app_${platform}_store_url`;

    const configKeys = {};
    const masterKeyOnly = {};

    configKeys[appStoreUrl] = latestVersionApp.get('downloadUrl');
    masterKeyOnly[appStoreUrl] = true;

    Parse.Config.save(configKeys, masterKeyOnly);

    return res.send(result.toJSON());
  } catch (error) {
    return res.status(500).send(error);
  }
});

module.exports = app;
