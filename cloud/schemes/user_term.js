const UserTermScheme = {
  className: "UserTerm",
  fields: {
    userId: {
      type: "String",
      required: true,
    },
    termId: {
      type: "String",
      required: true,
    }
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

const UserTermDefaultData = {
  "class": "UserTerm",
  "items": [],
}

module.exports = { UserTermScheme, UserTermDefaultData };