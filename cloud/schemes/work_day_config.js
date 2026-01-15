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
  "items": [],
}

module.exports = { WorkDayConfigScheme, WorkDayConfigDefaultData };