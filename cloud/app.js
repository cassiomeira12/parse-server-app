const express = require('express');
const app = express();

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
