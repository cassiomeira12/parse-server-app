const WorkDayConfigScheme = {
  className: "WorkDayConfig",
  fields: {
    weekDay: {
      type: "Number",
      required: true,
    },
    totalSeconds: {
      type: "Number",
      required: false,
      defaultValue: 0
    },
    workPointsConfig: {
      type: "Relation",
      targetClass: "WorkPointConfig",
      required: false,
    },
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: true
    },
    find: {
      requiresAuthentication: true
    },
    count: {
      "role:Admin": true
    },
    create: {
      requiresAuthentication: true
    },
    update: {
      requiresAuthentication: true
    },
    delete: {
      "role:Admin": true
    },
  },
};

const WorkDayConfigDefaultData = {
  "class": "WorkDayConfig",
  "items": [
    {
      "weekDay": 0,
    },
    {
      "weekDay": 1,
    },
    {
      "weekDay": 2,
    },
    {
      "weekDay": 3,
    },
    {
      "weekDay": 4,
    },
    {
      "weekDay": 5,
    },
    {
      "weekDay": 6,
    }
  ],
}

module.exports = { WorkDayConfigScheme, WorkDayConfigDefaultData };