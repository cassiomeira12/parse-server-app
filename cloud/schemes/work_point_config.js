const WorkPointConfigScheme = {
  className: "WorkPointConfig",
  fields: {
    weekDay: {
      type: "Number",
      required: true,
    },
    time: {
      type: "String",
      require: true,
    },
    seconds: {
      type: "Number",
      required: true,
    }
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

const WorkPointConfigDefaultData = {
  "class": "WorkPointConfig",
  "items": [],
}

module.exports = { WorkPointConfigScheme, WorkPointConfigDefaultData };