const UserScheme = {
  className: "_User",
  fields: {
    name: {
      type: "String",
      required: true,
    },
    phoneNumber: {
      type: "String",
      require: true,
    },
    phoneVerified: {
      type: "Boolean",
      require: false,
    },
    avatarUrl: {
      type: "String",
      require: false,
    },
    locale: {
      type: "String",
      require: false,
    }
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: true,
      "role:Admin": true
    },
    find: {
      requiresAuthentication: true,
      "role:Admin": true
    },
    count: {
      "role:Admin": true
    },
    create: {
      requiresAuthentication: true
    },
    update: {
      requiresAuthentication: true,
      "role:Admin": true
    },
    delete: {
      requiresAuthentication: true,
      "role:Admin": true
    },
  },
};

const UserDefaultData = {
  "class": "_User",
  "items": [],
}

module.exports = { UserScheme, UserDefaultData };