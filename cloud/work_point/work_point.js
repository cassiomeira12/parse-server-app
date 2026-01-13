const dateFormat = require('dateformat');
const schedule = require('node-schedule');

Parse.Cloud.define('registerPoint', async (request) => {
  const { user } = request;

  const date = new Date(new Date().toLocaleString('en', { timeZone: 'America/Sao_Paulo' }));

  const workPoint = new Parse.Object("WorkPoint");
  workPoint.set("day", date.getDate());
  workPoint.set("month", date.getMonth() + 1);
  workPoint.set("year", date.getFullYear());
  workPoint.set("time", dateFormat(date, 'HH:MM'));
  workPoint.set("manual", false);
  workPoint.set("deleted", false);

  await workPoint.save(null, { sessionToken: user.getSessionToken() });

  return await getWorkDay(date, user);
}, {
  requireUser: true,
});

Parse.Cloud.define('updateWorkDay', async (request) => {
  const { params, user } = request;

  const day = params.day;
  const month = params.month;
  const year = params.year;
  const allowance = params.allowance;
  const holiday = params.holiday;
  const dayOff = params.dayOff;
  const info = params.info;

  const queryWorkDay = new Parse.Query("WorkDay");
  queryWorkDay.equalTo("day", day);
  queryWorkDay.equalTo("month", month);
  queryWorkDay.equalTo("year", year);

  const workDayResponse = await queryWorkDay.first({ sessionToken: user.getSessionToken() });

  const date = new Date(year, month - 1, day);

  if (workDayResponse === undefined) {
    const workday = new Parse.Object("WorkDay");
    workday.set("day", day);
    workday.set("month", month);
    workday.set("year", year);
    workday.set("totalSeconds", 0);
    workday.set("weekend", isWeekend(date));
    workday.set("allowance", allowance);
    workday.set("holiday", holiday);
    workday.set("dayOff", dayOff);
    workday.set("info", info);

    await workday.save(null, { sessionToken: user.getSessionToken() });
  } else {
    workDayResponse.set("allowance", allowance);
    workDayResponse.set("holiday", holiday);
    workDayResponse.set("dayOff", dayOff);
    workDayResponse.set("info", info);

    await workDayResponse.save(null, { sessionToken: user.getSessionToken() });
  }

  return await getWorkDay(date, user);
}, {
  fields : {
    day : {
      required: true,
      type: Number,
      options: day => {
        return day >= 1 && day <= 31;
      },
      error: "Day has incorrect value"
    },
    month : {
      required: true,
      type: Number,
      options: month => {
        return month >= 1 && month <= 12;
      },
      error: "Month has incorrect value"
    },
    allowance : {
      required: true,
      type: Boolean,
    },
    holiday : {
      required: true,
      type: Boolean,
    },
    dayOff : {
      required: true,
      type: Boolean,
    },
    info : {
      required: true,
      type: String,
    },
  },
  requireUser: true,
});

Parse.Cloud.define('updateWorkPoint', async (request) => {
  const { params, user } = request;

  const workPointId = params.workPointId;
  const day = params.day;
  const month = params.month;
  const year = params.year;
  const time = params.time;

  const queryWorkPoint = new Parse.Query("WorkPoint");

  if (workPointId == undefined) {
    if (day != undefined && month != undefined && year != undefined && time != undefined) {
      const date = new Date(year, month - 1, day);

      const hour = time.split(":")[0];
      const minutes = time.split(":")[1];

      const hoursInSeconds = hour * 60 * 60;
      const minutesInSeconds = minutes * 60;
      const seconds = hoursInSeconds + minutesInSeconds;

      const workPoint = new Parse.Object("WorkPoint");
      workPoint.set("day", day);
      workPoint.set("month", month);
      workPoint.set("year", year);
      workPoint.set("time", formatTotalSeconds(seconds));
      workPoint.set("manual", true);
      workPoint.set("deleted", false);

      await workPoint.save(null, { sessionToken: user.getSessionToken() });

      return await getWorkDay(date, user);
    } else {
      return;
    }
  }

  const workPoint = await queryWorkPoint.get(workPointId, { sessionToken: user.getSessionToken() });
  
  if (time == undefined) {
    workPoint.set("deleted", true);
  } else {
    const hour = time.split(":")[0];
    const minutes = time.split(":")[1];

    const hoursInSeconds = hour * 60 * 60;
    const minutesInSeconds = minutes * 60;

    workPoint.set("seconds", hoursInSeconds + minutesInSeconds);
    workPoint.set("time", time);
    workPoint.set("manual", true);
  }

  await workPoint.save(null, { sessionToken: user.getSessionToken() });
 
  const date = new Date(workPoint.get('year'), workPoint.get('month') - 1, workPoint.get('day'));
  return await getWorkDay(date, user);
}, {
  fields : {
    workPointId : {
      required: false,
      type: String,
    }
  },
  requireUser: true,
});

Parse.Cloud.define('listPoints', async (request) => {
  const { params, user } = request;

  var month = params.month;
  var year = params.year;

  if (month == undefined || year == undefined) {
    const today = new Date();
    month = today.getMonth() + 1;
    year = today.getFullYear();
  }

  const date = new Date(year, month - 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const workDayList = [];
  
  for (let i = 1; i < lastDayOfMonth.getDate() + 1; i++) {
    const day = new Date(date.getFullYear(), date.getMonth(), i);
    const workDay = {
      'objectId': null,
      'day': i,
      'month': day.getMonth() + 1,
      'year': day.getFullYear(),
      'today': isToday(day),
      'dateFormatted': dateFormat(day, 'dd/mm/yyyy'),
      'totalSeconds': 0,
      'totalFormatted': "00:00",
      'weekend': isWeekend(day),
      'allowance': false,
      'holiday': false,
      'dayOff': false,
      'info': null,
      'hasInconsistency': false,
      'workPoints': [],
    };
    workDayList.push(workDay);
  }

  const queryWorkDay = new Parse.Query("WorkDay");
  queryWorkDay.equalTo("month", date.getMonth() + 1);
  queryWorkDay.equalTo("year", date.getFullYear());

  const workDayResponse = await queryWorkDay.find({ sessionToken: user.getSessionToken() });

  const workDayRegistered = await Promise.all(workDayResponse.map(async (workDay) => {
    const workPointsRelation = workDay.relation('workPoints');
    const workPointsQuery = workPointsRelation.query();
    workPointsQuery.equalTo("deleted", false);
    workPointsQuery.ascending("seconds");

    const workPointsResponse = await workPointsQuery.find({ sessionToken: user.getSessionToken() });

    const total = workDay.get('totalSeconds');
    const allowToCalcTime = workPointsResponse.length % 2 === 0;

    const workPoints = workPointsResponse.map((workPoint) => {
      return formatWorkPoint(workPoint);
    });

    const day = workDay.get('day');
    const month = workDay.get('month');
    const year = workDay.get('year');
    const date = new Date(year, month - 1, day);

    return {
      'objectId': workDay.id,
      'day': day,
      'month': month,
      'year': year,
      'today': isToday(date),
      'dateFormatted': dateFormat(date, 'dd/mm/yyyy'),
      'totalSeconds': total,
      'totalFormatted': formatTotalSeconds(total),
      'weekend': isWeekend(date),
      'allowance': workDay.get('allowance'),
      'holiday': workDay.get('holiday'),
      'dayOff': workDay.get('dayOff'),
      'info': workDay.get('info'),
      'hasInconsistency': !allowToCalcTime,
      'workPoints': workPoints,
    }
  }));

  workDayRegistered.map((workDay) => {
    workDayList[workDay['day'] - 1] = workDay;
  });

  return workDayList;
}, {
  fields : {
    month : {
      required: false,
      type: Number,
      options: month => {
        return month >= 1 && month <= 12;
      },
      error: "Month has incorrect value"
    },
    year : {
      required: false,
      type: Number,
      options: year => {
        const date = new Date();
        return year >= 2000 && year <= date.getFullYear();
      },
      error: "Year has incorrect value"
    },
  },
  requireUser: true,
});

Parse.Cloud.define('resumeWorkMonth', async (request) => {
  const { params, user } = request;

  var month = params.month;
  var year = params.year;

  if (month == undefined || year == undefined) {
    const today = new Date();
    month = today.getMonth() + 1;
    year = today.getFullYear();
  }

  const newParams = {
    'month': month,
    'year': year,
  };

  const workDayResponse = await Parse.Cloud.run('listPoints', newParams, { sessionToken: user.getSessionToken() });

  var totalAllowanceDays = 0;
  var totalDaysOff = 0;
  var totalHolidays = 0;
  var totalSecondsMonth = 0;

  workDayResponse.map((workDay) => {
    const weekend = workDay['weekend'];
    const allowance = workDay['allowance'];
    const holiday = workDay['holiday'];
    const dayOff = workDay['dayOff'];
    const hasInconsistency = workDay['hasInconsistency'];
    const totalSeconds = workDay['totalSeconds'] ?? 0;

    if (allowance) {
      totalAllowanceDays++;
    }

    if (holiday) {
      totalHolidays++;
    }

    if (dayOff) {
      totalDaysOff++;
    }

    if (!hasInconsistency) {
      totalSecondsMonth = totalSecondsMonth + totalSeconds
    }
  });

  return {
    'totalAllowanceDays': totalAllowanceDays,
    'totalHolidays': totalHolidays,
    'totalDaysOff': totalDaysOff,
    'totalSeconds': totalSecondsMonth,
    'totalFormatted': formatTotalSeconds(totalSecondsMonth),
  };
}, {
  fields : {
    month : {
      required: false,
      type: Number,
      options: month => {
        return month >= 1 && month <= 12;
      },
      error: "Month has incorrect value"
    },
    year : {
      required: false,
      type: Number,
      options: year => {
        const date = new Date();
        return year >= 2000 && year <= date.getFullYear();
      },
      error: "Year has incorrect value"
    },
  },
  requireUser: true,
});

Parse.Cloud.define('workDayConfig', async (request) => {
  const { params, user } = request;

  const weekDay = params.weekDay;

  const workDayConfig = new Parse.Object("WorkDayConfig");
  workDayConfig.set("weekDay", weekDay);
  workDayConfig.set("totalSeconds", 1);
  await workDayConfig.save(null, { sessionToken: user.getSessionToken() });

  const workDayConfigQuery = new Parse.Query("WorkDayConfig");
  workDayConfigQuery.ascending("weekDay");

  const weekDays = await workDayConfigQuery.find({ sessionToken: user.getSessionToken() });

  return weekDays.filter((weekDay) => {
    return weekDay.get("totalSeconds") > 0;
  }).map((weekDay) => {
    return {
      objectId: weekDay.id,
      weekDay: weekDay.get("weekDay"),
      totalSeconds: weekDay.get("totalSeconds"),
      createdAt: weekDay.createdAt.toISOString(),
      updatedAt: weekDay.updatedAt.toISOString(),
    }
  });
}, {
  fields: ['weekDay'],
  requireUser: true,
});

Parse.Cloud.define('workPointConfig', async (request) => {
  const { params, user } = request;

  const weekDay = params.weekDay;
  const time = params.time;

  const workPointConfig = new Parse.Object("WorkPointConfig");
  workPointConfig.set("weekDay", weekDay);
  workPointConfig.set("time", time);
  await workPointConfig.save(null, { sessionToken: user.getSessionToken() });

  const workDayConfigQuery = new Parse.Query("WorkDayConfig");
  workDayConfigQuery.greaterThan("totalSeconds", 0);
  workDayConfigQuery.ascending("weekDay");

  const weekDays = await workDayConfigQuery.find({ sessionToken: user.getSessionToken() });

  const response = await Promise.all(
    weekDays.map(async (weekDay) => {
      const query = new Parse.Query("WorkPointConfig");
      query.equalTo("weekDay", weekDay.get("weekDay"));
      query.ascending("seconds");
      var result = await query.find({ sessionToken: user.getSessionToken() });
      return {
        "objectId": weekDay.id,
        "weekDay": weekDay.get("weekDay"),
        "totalSeconds": weekDay.get("totalSeconds"),
        "totalFormatted": formatTotalSeconds(weekDay.get("totalSeconds")),
        "weekDays": result.map((workPoint) => workPoint.get("time")),
      };
    }),
  );

  return response;
}, {
  fields: ['weekDay', 'time'],
  requireUser: true,
});

Parse.Cloud.define('updateWorkPointConfig', async (request) => {
  const { params, user } = request;

  const weekDay = params.weekDay;
  const oldTime = params.oldTime;
  const newTime = params.newTime;

  const workPointConfigQuery = new Parse.Query("WorkPointConfig");
  workPointConfigQuery.equalTo("weekDay", weekDay);
  workPointConfigQuery.equalTo("time", oldTime);

  const workPointConfig = await workPointConfigQuery.first({ sessionToken: user.getSessionToken() });

  if (workPointConfig == undefined) {
    throw 'work-point-config-not-found';
  }

  workPointConfig.set('time', newTime);
  await workPointConfig.save(null, { sessionToken: user.getSessionToken() });

  return await Parse.Cloud.run('listWorkPointsConfig', null, { sessionToken: user.getSessionToken() });
}, {
  fields: ['weekDay', 'oldTime', 'newTime'],
  requireUser: true,
});

Parse.Cloud.define('listWorkPointsConfig', async (request) => {
  const { user } = request;

  const workDayConfigQuery = new Parse.Query("WorkDayConfig");
  workDayConfigQuery.greaterThan("totalSeconds", 0);
  workDayConfigQuery.ascending("weekDay");

  const weekDays = await workDayConfigQuery.find({ sessionToken: user.getSessionToken() });

  const response = await Promise.all(
    weekDays.map(async (weekDay) => {
      const query = new Parse.Query("WorkPointConfig");
      query.equalTo("weekDay", weekDay.get("weekDay"));
      query.ascending("seconds");
      var result = await query.find({ sessionToken: user.getSessionToken() });
      return {
        "objectId": weekDay.id,
        "weekDay": weekDay.get("weekDay"),
        "totalSeconds": weekDay.get("totalSeconds"),
        "totalFormatted": formatTotalSeconds(weekDay.get("totalSeconds")),
        "weekDays": result.map((workPoint) => workPoint.get("time")),
      };
    }),
  );

  return response;
}, {
  requireUser: true,
});

Parse.Cloud.beforeSave("WorkPoint", async (request) => {
  const { original, object, user } = request;

  const time = object.get("time");
  const hour = time.split(":")[0];
  const minutes = time.split(":")[1];

  const hoursInSeconds = hour * 60 * 60;
  const minutesInSeconds = minutes * 60;
  const seconds = hoursInSeconds + minutesInSeconds;

  object.set("seconds", seconds);

  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

Parse.Cloud.beforeSave("WorkDay", async (request) => {
  const { original, object, user } = request;

  if (original === undefined) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

Parse.Cloud.afterSave("WorkPoint", async (request) => { 
  const { object, user } = request;

  const queryWorkDay = new Parse.Query("WorkDay");
  queryWorkDay.equalTo("day", object.get("day"));
  queryWorkDay.equalTo("month", object.get("month"));
  queryWorkDay.equalTo("year", object.get("year"));

  const workDay = await queryWorkDay.first({ sessionToken: user.getSessionToken() });

  if (workDay === undefined) {
    const date = new Date(object.get("year"), object.get("month") - 1, object.get("day"));

    const workday = new Parse.Object("WorkDay");
    workday.set("day", object.get("day"));
    workday.set("month", object.get("month"));
    workday.set("year", object.get("year"));
    workday.set("totalSeconds", 0);
    workday.set("weekend", isWeekend(date));
    workday.set("allowance", false);
    workday.set("holiday", false);
    workday.set("dayOff", false);
    workday.set("info", null);

    const workPoints = workday.relation('workPoints');
    workPoints.add(object);

    await workday.save(null, { sessionToken: user.getSessionToken() });
  } else {
    const queryWorkPoint = new Parse.Query("WorkPoint");
    queryWorkPoint.equalTo("day", object.get("day"));
    queryWorkPoint.equalTo("month", object.get("month"));
    queryWorkPoint.equalTo("year", object.get("year"));
    queryWorkPoint.equalTo("deleted", false);
    queryWorkPoint.descending("seconds");

    var responseWorkPoint = await queryWorkPoint.find({ sessionToken: user.getSessionToken() });

    const workPoints = workDay.relation('workPoints');
    workPoints.add(object);

    if (responseWorkPoint.length > 1) {
      const allowToCalcTime = responseWorkPoint.length % 2 === 0;
      if (!allowToCalcTime) {
        responseWorkPoint = responseWorkPoint.slice(1);
      }
      var totalSeconds = 0;
      for (let i = 0; i < responseWorkPoint.length; i += 2) {
        const endWorkPoint = responseWorkPoint[i];
        const beginWorkPoint = responseWorkPoint[i + 1];
        const seconds = endWorkPoint.get('seconds') - beginWorkPoint.get('seconds');
        totalSeconds = totalSeconds + seconds;
      }
      workDay.set("totalSeconds", totalSeconds);
    } else {
      workDay.set("totalSeconds", 0);
    }

    await workDay.save(null, { sessionToken: user.getSessionToken() });
  }
});

Parse.Cloud.beforeSave("WorkDayConfig", async (request) => {
  const { original, object, user } = request;

  if (original === undefined && user != undefined) {
    const workDayConfigQuery = new Parse.Query("WorkDayConfig");
    workDayConfigQuery.equalTo("weekDay", object.get("weekDay"));
    workDayConfigQuery.greaterThan("totalSeconds", 0);

    const workDayConfig = await workDayConfigQuery.first({ sessionToken: user.getSessionToken() });

    if (workDayConfig != undefined) {
      throw 'already_created_work_day_config';
    }

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);
  }
});

Parse.Cloud.beforeSave("WorkPointConfig", async (request) => {
  const { original, object, user } = request;

  const time = object.get("time");
  const hour = time.split(":")[0];
  const minutes = time.split(":")[1];

  const hoursInSeconds = hour * 60 * 60;
  const minutesInSeconds = minutes * 60;
  const seconds = hoursInSeconds + minutesInSeconds;

  const weekDay = object.get("weekDay");

  object.set("seconds", seconds);

  if (original == undefined) {
    const workPointConfigQuery = new Parse.Query("WorkPointConfig");
    workPointConfigQuery.equalTo("weekDay", weekDay);
    workPointConfigQuery.equalTo("time", time);
    workPointConfigQuery.equalTo("seconds", seconds);

    const workPointConfig = await workPointConfigQuery.first({ sessionToken: user.getSessionToken() });
    if (workPointConfig != undefined) {
      throw 'already_created_work_point_config';
    }

    const workDayConfigQuery = new Parse.Query("WorkDayConfig");
    workDayConfigQuery.equalTo("weekDay", weekDay);
    workDayConfigQuery.greaterThan("totalSeconds", 0);

    const workDayConfigResponse = await workDayConfigQuery.first({ sessionToken: user.getSessionToken() });
    if (workDayConfigResponse == undefined) {
      const workDayConfig = new Parse.Object("WorkDayConfig");
      workDayConfig.set("weekDay", weekDay);
      workDayConfig.set("totalSeconds", 1);

      await workDayConfig.save(null, { sessionToken: user.getSessionToken() });
    } else {
      const workPointsConfig = workDayConfigResponse.relation('workPointsConfig');
      const workPointsConfigQuery = workPointsConfig.query();

      var workPointsConfigResponse = await workPointsConfigQuery.find({ sessionToken: user.getSessionToken() });

      workPointsConfigResponse.push(object);

      workPointsConfigResponse.sort(function (a, b) {
        return b.get("seconds") - a.get("seconds");
      });

      if (workPointsConfigResponse.length > 1) {
        const allowToCalcTime = workPointsConfigResponse.length % 2 === 0;
        if (!allowToCalcTime) {
          workPointsConfigResponse = workPointsConfigResponse.slice(1);
        }
        var totalSeconds = 0;
        for (let i = 0; i < workPointsConfigResponse.length; i += 2) {
          const endWorkPoint = workPointsConfigResponse[i];
          const beginWorkPoint = workPointsConfigResponse[i + 1];
          const seconds = endWorkPoint.get('seconds') - beginWorkPoint.get('seconds');
          totalSeconds = totalSeconds + seconds;
        }
        workDayConfigResponse.set("totalSeconds", totalSeconds);
      } else {
        workDayConfigResponse.set("totalSeconds", 1);
      }

      workDayConfigResponse.save(null, { sessionToken: user.getSessionToken() });
    }

    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    acl.setRoleReadAccess("Admin", true);
    acl.setRoleWriteAccess("Admin", true);
    
    object.setACL(acl);

    const workPointScheduleQuery = new Parse.Query("WorkPointConfig");
    workPointScheduleQuery.equalTo("weekDay", weekDay);
    workPointScheduleQuery.equalTo("time", time);
    workPointScheduleQuery.equalTo("seconds", seconds);

    const workPointSchedule = await workPointScheduleQuery.first({ useMasterKey: true });
    if (workPointSchedule != undefined) return;

    const jobName = `work-point-push-[${weekDay}]-${hour}-${minutes}`;
    console.log(`ScheduleJob ${jobName}`);

    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = weekDay;
    rule.hour = hour;
    rule.minute = minutes;

    schedule.scheduleJob(jobName, rule, function() {
      const now = new Date();
      console.log(`mandou push às ${now}`);
    });
  } else {
    //
  }
});

Parse.Cloud.afterSave("WorkPointConfig", async (request) => {
  const { object, user } = request;

  const weekDay = object.get("weekDay");

  const workDayConfigQuery = new Parse.Query("WorkDayConfig");
  workDayConfigQuery.equalTo("weekDay", weekDay);
  workDayConfigQuery.greaterThan("totalSeconds", 0);

  const workDayConfigResponse = await workDayConfigQuery.first({ sessionToken: user.getSessionToken() });

  const workPointsConfig = workDayConfigResponse.relation('workPointsConfig');
  workPointsConfig.add(object);

  workDayConfigResponse.save(null, { sessionToken: user.getSessionToken() });
});

Parse.Cloud.job("startWorkPointSchedules", async (request) => {
  const workPointConfigQuery = new Parse.Query("WorkPointConfig");
  const pipeline = [
    {
      $group: {
        _id: '$time',
        weekDay: { $last: '$weekDay' },
      },
    }
  ];

  const results = await workPointConfigQuery.aggregate(pipeline);

  const response = await Promise.all(
    results.map(async (value) => {
      const query = new Parse.Query("WorkPointConfig");
      query.equalTo("time", value["objectId"]);
      query.ascending("weekDay");
      const result = await query.distinct("weekDay");
      return {
        "time": value["objectId"],
        "weekDays": result,
      };
    }),
  );

  response.map((workPointConfig) => {
    const time = workPointConfig['time'];
    const hour = time.split(":")[0];
    const minutes = time.split(":")[1];
    const weekDays = workPointConfig['weekDays'];

    const jobName = `work-point-push-[${weekDays}]-${hour}-${minutes}`;
    console.log(`ScheduleJob ${jobName}`);

    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = workPointConfig['weekDays'];
    rule.hour = hour;
    rule.minute = minutes;

    schedule.scheduleJob(jobName, rule, function() {
      const now = new Date();
      console.log(`mandou push às ${now}`);
    });
  });

  return schedule.scheduledJobs;
});

function formatWorkPoint(workPoint) {
  return {
    objectId: workPoint.id,
    day: workPoint.get("day"),
    month: workPoint.get("month"),
    year: workPoint.get("year"),
    time: workPoint.get("time"),
    seconds: workPoint.get("seconds"),
    manual: workPoint.get("manual"),
    deleted: workPoint.get("deleted"),
    createdAt: workPoint.createdAt.toISOString(),
    updatedAt: workPoint.updatedAt.toISOString(),
  };
}

function formatTotalSeconds(total) {
  var hour = Math.floor(total / 3600);
  var minutes = Math.floor(total % 3600 / 60);
  var hourFormatted = String(hour).padStart(2, '0');
  var minutesFormatted = String(minutes).padStart(2, '0');

  return `${hourFormatted}:${minutesFormatted}`;
}

function isToday(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sameYear = date.getFullYear() == today.getFullYear();
  const sameMonth = date.getMonth() == today.getMonth();
  const sameDay = date.getDate() == today.getDate();

  const isToday = sameYear && sameMonth && sameDay;

  return isToday;
}

function isWeekend(date) {
  const dayOfWeek = date.getDay();
  return (dayOfWeek === 6) || (dayOfWeek  === 0); // 6 = Saturday, 0 = Sunday
}

async function getWorkDay(date, user) {
  const queryWorkDay = new Parse.Query("WorkDay");
  queryWorkDay.equalTo("day", date.getDate());
  queryWorkDay.equalTo("month", date.getMonth() + 1);
  queryWorkDay.equalTo("year", date.getFullYear());

  const workDayResponse = await queryWorkDay.first({ sessionToken: user.getSessionToken() });

  const workPointsRelation = workDayResponse.relation('workPoints');
  const workPointsQuery = workPointsRelation.query();
  workPointsQuery.equalTo("deleted", false);
  workPointsQuery.ascending("seconds");

  const workPointsResponse = await workPointsQuery.find({ sessionToken: user.getSessionToken() });

  const total = workDayResponse.get('totalSeconds');
  const allowToCalcTime = workPointsResponse.length % 2 === 0;

  const workPoints = workPointsResponse.map((workPoint) => {
    return formatWorkPoint(workPoint);
  });

  return {
    'objectId': workDayResponse.id,
    'day': workDayResponse.get('day'),
    'month': workDayResponse.get('month'),
    'year': workDayResponse.get('year'),
    'today': isToday(date),
    'dateFormatted': dateFormat(date, 'dd/mm/yyyy'),
    'totalSeconds': total,
    'totalFormatted': formatTotalSeconds(total),
    'weekend': isWeekend(date),
    'allowance': workDayResponse.get('allowance'),
    'holiday': workDayResponse.get('holiday'),
    'dayOff': workDayResponse.get('dayOff'),
    'info': workDayResponse.get('info'),
    'hasInconsistency': !allowToCalcTime,
    'workPoints': workPoints,
  };
}