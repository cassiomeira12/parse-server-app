const OccurrenceScheme = {
  className: "Occurrence",
  fields: {
    user: {
      type: "Pointer",
      targetClass: "_User",
    },
    latitude: {
      type: "Number",
      require: true,
    },
    longitude: {
      type: "Number",
      require: true,
    },
    accuracy: {
      type: "Number",
      require: true,
    },
    choice: {
      type: "Number",
      require: true,
    },
    contactSent: {
      type: "String",
      require: false,
    },
    safetyContactsSent: {
      type: "Relation",
      targetClass: "SafetyContact",
      required: false,
    },
  },
  protectedFields: {
    "*": ["user", "contactSent"],
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: true
    },
    find: {
      requiresAuthentication: true
    },
    count: {
      requiresAuthentication: true
    },
    create: {
      requiresAuthentication: true
    },
    update: {
      "role:Admin": true
    },
    delete: {
      "role:Admin": true
    },
  },
}

const OccurrenceDefaultData = {
  "class": "Ocurrence",
  "items": [],
}

module.exports = { OccurrenceScheme, OccurrenceDefaultData };