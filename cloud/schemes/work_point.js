const WorkPointScheme = {
  className: "WorkPoint",
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
    time: {
      type: "String",
      require: true,
    },
    seconds: {
      type: "Number",
      required: true,
    },
    manual: {
      type: "Boolean",
      required: false,
      defaultValue: false
    },
    deleted: {
      type: "Boolean",
      required: false,
      defaultValue: false
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

const WorkPointDefaultData = {
  "class": "WorkPoint",
  "items": [],
}

module.exports = { WorkPointScheme, WorkPointDefaultData };