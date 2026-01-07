const WorkDayScheme = {
  className: "WorkDay",
  fields: {
    day: {
      type: "Number",
      required: true,
    },
    month: {
      type: "Number",
      required: true,
    },
    year: {
      type: "Number",
      required: true,
    },
    totalSeconds: {
      type: "Number",
      required: false,
      defaultValue: 0
    },
    allowance: {
      type: "Boolean",
      required: false,
      defaultValue: false
    },
    weekend: {
      type: "Boolean",
      required: false,
      defaultValue: false
    },
    holiday: {
      type: "Boolean",
      required: false,
      defaultValue: false
    },
    dayOff: {
      type: "Boolean",
      required: false,
      defaultValue: false
    },
    info: {
      type: "String",
      require: false,
    },
    workPoints: {
      type: "Relation",
      targetClass: "WorkPoint",
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

const WorkDayDefaultData = {
  "class": "WorkDay",
  "items": [],
}

module.exports = { WorkDayScheme, WorkDayDefaultData };