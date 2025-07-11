const express = require('express');
const { default: ParseServer, ParseGraphQLServer } = require('parse-server');
const { path, resolve } = require('path');
const http = require('http');

require('dotenv/config');
const ParseDashboard = require('parse-dashboard');
const cors = require('cors');
const helmet = require('helmet');

const { schemes, defaultData } = require('./cloud/schemes/schemes');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

const parseMount = process.env.PARSE_MOUNT;
const serverURL = process.env.SERVER_URL + ':' + process.env.PORT;
const graphQLServerURL = serverURL + '/graphql';

const config = {
  appName: process.env.APP_NAME,
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  restAPIKey: process.env.REST_API_KEY,
  clientKey: process.env.CLIENT_KEY,
  databaseURI: databaseUri,
  cloud: __dirname + "/cloud/main.js",
  serverURL: serverURL + parseMount,
  publicServerURL: process.env.PUBLIC_SERVER_URL,
  graphQLServerURL: graphQLServerURL,
  "verbose": false,
  "directAccess": true,
  "verifyUserEmails": false,
  "preventLoginWithUnverifiedEmail": false,
  "emailVerifyTokenValidityDuration": 3600 * 1, // Token expires in 1 hour
  "revokeSessionOnPasswordReset": true,
  "enforcePrivateUsers": true,
  "enableAnonymousUsers": false,
  "allowClientClassCreation": false,
  "allowExpiredAuthDataToken": false,
  "expireInactiveSessions": true,
  "sessionLength": 3600 * 24 * 5, // Session expires in 5 days
  "jsonLogs": true,
  "logsFolder": "./logs",
  "startLiveQueryServer": true,
  "liveQuery": {
    "classNames": [], //config.liveQueryClasses,
    "liveQueryServerURL": "ws://localhost:1337"
  },
  "schema": {
    "definitions": schemes,
    "lockSchemas": false,
    "strict": false,
    "recreateModifiedFields": false,
    "deleteExtraFields": false,
  },
  "accountLockout": null,
  "passwordPolicy": {
    "doNotAllowUsername": true,
    "maxPasswordHistory": null,
  },
  "fileUpload": {
    "enableForPublic": false,
    "enableForAnonymousUser": false,
    "enableForAuthenticatedUser": true,
  },
  "security": {
    "enableCheck": true,
    "enableCheckLog": true,
    "checkGroups": [],
  },
  "serverStartComplete": () => {
    console.log('Parse server started');
    Parse.Cloud.startJob("createDefaultData", {"data": defaultData});
  }
};

const parseServer = new ParseServer(config);

var app;
try {
    app = require('./cloud/app');
    app.enable('trust proxy');
    app.set('trust proxy', true);
} catch (_) {
    app = express();
    app.enable('trust proxy');
    app.set('trust proxy', true);
}

const projectPath = config.projectPath || __dirname;

const webAppPath = process.env.WEB_APP || '/';
const webFolder = process.env.WEB_APP_FOLDER || '/public';

app.use('/public', express.static(resolve(projectPath + '/public')));

if (webFolder === '/public') {
  app.use(express.static(resolve(projectPath + '/public')));
} else {
  app.use(express.static(resolve(projectPath + webFolder)));
  app.use(webAppPath, express.static(resolve(projectPath + webFolder)));
}

if (webAppPath !== '/') {
  app.get('/', (_, res) => {
    res.redirect(webAppPath);
  });
}

app.get(webAppPath, (_, res) => {
  res.sendFile(resolve(projectPath + webFolder + '/index.html'));
});

app.get('/privacy-policy', (_, res) => {
  res.sendFile(resolve(projectPath + '/public/privacy_policy.html'));
});

app.get('/terms-conditions', (_, res) => {
  res.sendFile(resolve(projectPath + '/public/terms_conditions.html'));
});

var usersDashboards = undefined;
if (process.env.USERS) {
  usersDashboards = JSON.parse(process.env.USERS);
}

var dashboardApps = [];
if (process.env.DASHBOARD_APPS) {
  dashboardApps = JSON.parse(process.env.DASHBOARD_APPS);
}

const parseDashboard = new ParseDashboard({
  apps: [
    ...dashboardApps,
    {
      'appName': process.env.APP_NAME,
      'appId': process.env.APP_ID,
      'masterKey': process.env.MASTER_KEY,
      'serverURL': serverURL + parseMount,
      'graphQLServerURL': graphQLServerURL,
      'enableSecurityChecks': true,
      'iconName': process.env.ICON,
      'production': false
    }
  ],
  iconsFolder: process.env.ICONS_FOLDER,
  users: usersDashboards,
  useEncryptedPasswords: true,
  trustProxy: 1
}, { allowInsecureHTTP: true });

app.use('/dashboard', parseDashboard);

var allowedOrigins = process.env.ALLOWED_ORIGINS_CORS || [];

if (allowedOrigins) {
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());

  app.use(cors({
    origin: true,
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.';
        return callback(Error(msg), false);
      }
      return callback(null, true);
    }
  }));
} else {
  app.options('*', cors());
}

app.all('*', (req, res, next) => {
  const origin = req.get('origin') || req.headers.origin;
  const ignoreGetRequest = req.method !== 'GET';
  if (origin === undefined && ignoreGetRequest) {
    if (req.header('X-Parse-Client-Key') !== config.clientKey) {
      return res.status(403).send({
        'error': 'unauthorized',
      });
    }
  }
  next();
});

app.use(parseMount, parseServer.app);

const parseGraphQLServer = new ParseGraphQLServer(
  parseServer, { graphQLPath: '/graphql' }
);

parseGraphQLServer.applyGraphQL(app);

const server = http.createServer(app);

server.listen(process.env.PORT, function () {
  console.log(`Parse App ${config.appName}`);
  console.log('Parse running on ' + serverURL);
  console.log('Parse Web App ' + serverURL + process.env.WEB_APP);
  console.log('Parse Public URL ' + process.env.PUBLIC_SERVER_URL);
  console.log(`REST API running on ${serverURL + parseMount}`);
  console.log('GraphQL API running on ' + graphQLServerURL);
  console.log('Parse Dashboard running on ' + process.env.SERVER_URL + ':' + process.env.PORT + '/dashboard');
  console.log('Parse Web App Privacy Policy ' + process.env.SERVER_URL + ':' + process.env.PORT + '/privacy-policy');
  console.log('Parse Web App Terms Conditions ' + process.env.SERVER_URL + ':' + process.env.PORT + '/terms-conditions');
  console.log(`Allowed Origins ${allowedOrigins}`);
});

ParseServer.createLiveQueryServer(server);