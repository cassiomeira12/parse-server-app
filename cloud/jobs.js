var schedule = require('node-schedule');

// *    *    *    *    *    *
// second (0 - 59, OPTIONAL)
// minute (0 - 59)
// hour (0 - 23)
// day of month (1 - 31)
// month (1 - 12)
// day of week (0 - 7) (0 or 7 is Sun)

// '*/5 * * * *' every 5 min

// Schedule 00:00h every day
schedule.scheduleJob('* * 0 * *', function () {
  Parse.Cloud.startJob("clearOldSessions");
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

  const results = await querySession.find({ useMasterKey: true });

  results.forEach(object => {
    object.destroy({ useMasterKey: true }).then(destroyed => {
      console.log("Successfully destroyed object" + JSON.stringify(destroyed));
    }).catch(error => {
      console.log("Error: " + error.code + " - " + error.message);
    })
  });

  return ("Successfully retrieved " + results.length + " invalid logins.");
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