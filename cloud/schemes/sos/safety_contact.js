const SafetyContactScheme = {
  className: "SafetyContact",
  fields: {
    user: {
      type: "Pointer",
      targetClass: "_User",
    },
    name: {
      type: "String",
      required: true,
    },
    phoneNumber: {
      type: "String",
      require: true,
    },
    avatarUrl: {
      type: "String",
      require: false,
    },
  },
  classLevelPermissions: {
    get: {
      "role:Admin": true
    },
    find: {
      "role:Admin": true
    },
    count: {
      "role:Admin": true
    },
    create: {
      requiresAuthentication: true
    },
    update: {
      "role:Admin": true
    },
    delete: {
      requiresAuthentication: true
    },
  },
};

const SafetyContactDefaultData = {
  "class": "SafetyContact",
  "items": [],
}

module.exports = { SafetyContactScheme, SafetyContactDefaultData };