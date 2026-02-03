const Sentry = require("@sentry/node");

function catchError(error) {
  console.error('Error:', error);

  // ignore errors
  switch (error) {
    case 'Incorrect Firebase Messaging Project':
      return;
  }

  Sentry.captureException(error);
}

module.exports = { catchError };