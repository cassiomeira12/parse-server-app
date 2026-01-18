const Sentry = require("@sentry/node");

function catchError(error) {
  console.error('Error:', error);
  Sentry.captureException(error);
}

module.exports = { catchError };