const schedule = require('node-schedule');
const { resolve } = require('path');
const spawn = require('child_process').spawn;
const dateFormat = require('dateformat');

// *    *    *    *    *    *
// 1 second (0 - 59, OPTIONAL)
// 2 minute (0 - 59)
// 3 hour (0 - 23)
// 4 day of month (1 - 31)
// 5 month (1 - 12)
// 6 day of week (0 - 7) (0 or 7 is Sun)

// Schedule 23:59:45h every day
schedule.scheduleJob('45 59 23 * * *', function () {
  Parse.Cloud.startJob("clearOldSessions");
});

// Schedule 23:59:59h every day
schedule.scheduleJob('59 59 23 * * *', function () {
  Parse.Cloud.startJob("backupDatabase");
});

Parse.Cloud.job("clearOldSessions", async (request) => {
  let date = new Date();
  let timeNow = date.getTime();
  let intervalOfTime = 3 * 60 * 1000;  // the time set is 3 minutes in milliseconds
  let timeThen = timeNow - intervalOfTime;

  // Limit date
  let queryDate = new Date();
  queryDate.setTime(timeThen);

  // The query object
  let querySession = new Parse.Query(Parse.Session);

  querySession.lessThanOrEqualTo("expiresAt", date);

  const results = await querySession.findAll({ useMasterKey: true });

  results.forEach(object => {
    object.destroy({ useMasterKey: true }).then(destroyed => {
      console.log("Successfully destroyed object" + JSON.stringify(destroyed));
    }).catch(error => {
      console.log("Error: " + error.code + " - " + error.message);
    })
  });

  const dateBR = new Date(new Date().toLocaleString('en', { timeZone: 'America/Sao_Paulo' }));
  return ("Successfully retrieved " + results.length + " invalid logins at " + dateFormat(dateBR, 'dd/mm/yyyy HH:MM'));
});

Parse.Cloud.job("createDefaultData", async (request) => {
  const { params } = request;

  const defaultData = params.data;

  await Promise.all(defaultData.map(async (data) => {
    const className = data.class;
    const classData = data.items;
    console.log(className);

    await Promise.all(classData.map(async (item) => {
      const query = new Parse.Query(className);
      const object = new Parse.Object(className);

      for (const key in item) {
        if (key !== 'password') {
          query.equalTo(key, item[key]);
        }
        object.set(key, item[key]);
      }

      const result = await query.find({ useMasterKey: true });

      if (result.length == 0) {
        try {
          var acl = new Parse.ACL();
          acl.setPublicReadAccess(true);
          acl.setPublicWriteAccess(false);
          if (className !== "_Role") {
            acl.setRoleReadAccess("Admin", true);
            acl.setRoleWriteAccess("Admin", true);
          }
          object.setACL(acl);

          const objectResult = await object.save(null, { useMasterKey: true });
          console.log(objectResult.toJSON());

          if (className === "_User") {
            const queryRole = new Parse.Query("_Role");
            queryRole.equalTo('name', 'Admin');
            const adminRole = await queryRole.first({ useMasterKey: true });
            const users = adminRole.relation('users');
            users.add(objectResult);
            await adminRole.save(null, { useMasterKey: true });
          }

        } catch (exception) {
          console.log(exception);
        }
      }
    }));
  }));
});

Parse.Cloud.job("backupDatabase", async (request) => {
  const date = new Date(new Date().toLocaleString('en', { timeZone: 'America/Sao_Paulo' }))

  const backupPath = `/${dateFormat(date, 'mm-yyyy')}/${dateFormat(date, 'dd')}/`;
  const backupsPath = resolve(__dirname + '/../../backups' + backupPath);
  const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

  spawn('mongodump', [`--uri="${databaseUri}"`, `--out=${backupsPath}`]);

  return (`Backup database at ${dateFormat(date, 'dd/mm/yyyy HH:MM')}h`);
});

Parse.Cloud.job("restoreLastBackup", async (request) => {
  const date = new Date(new Date().toLocaleString('en', { timeZone: 'America/Sao_Paulo' }))
  const yesterday = date.setDate(date.getDate() - 1);

  const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
  const backupPath = `/${dateFormat(date, 'mm-yyyy')}/${dateFormat(yesterday, 'dd')}`;
  const databaseName = new URL(databaseUri).pathname.replace('/', '');
  const backupsPath = resolve(__dirname + '/../../backups' + backupPath + `/${databaseName}`);

  spawn('mongorestore', [`--uri="${databaseUri}"`,'--drop', backupsPath]);
});