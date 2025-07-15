const { UserScheme } = require('./user');

const UserDeletedScheme = {
  className: "UserDeleted",
  fields: {
    ...UserScheme.fields,
    userId: {
      type: "String",
      required: true,
    },
    username: {
      type: "String",
      required: true,
    },
    email: {
      type: "String",
      required: true,
    },
    emailVerified: {
      type: "Boolean",
      required: false,
    },
    reason: {
      type: "String",
      required: true,
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
      "role:Admin": true
    },
    update: {
      "role:Admin": true
    },
    delete: {
      "role:Admin": true
    },
  },
};

const UserDeletedDefaultData = {
  "class": "UserDeleted",
  "items": [],
}

module.exports = { UserDeletedScheme, UserDeletedDefaultData };