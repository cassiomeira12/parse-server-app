const UserSoSConfigScheme = {
  className: "UserSoSConfig",
  fields: {
    user: {
      type: "Pointer",
      targetClass: "_User",
    },
    onlyPolice: {
      type: "Boolean",
      require: false,
      defaultValue: false
    },
    onlySafetyContacts: {
      type: "Boolean",
      require: false,
      defaultValue: true
    },
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: true
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
      requiresAuthentication: true
    },
    delete: {
      "role:Admin": true
    },
  },
};

const UserSoSConfigDefaultData = {
  "class": "UserSoSConfig",
  "items": [],
}

module.exports = { UserSoSConfigScheme, UserSoSConfigDefaultData };