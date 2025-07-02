const express = require('express');
const app = express();

app.get('/hello', (req, res) => {
  res.send("Parse Server Cloud Code");
});

module.exports = app;
