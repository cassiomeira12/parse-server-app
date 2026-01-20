const SessionScheme = {
  className: "_Session",
  fields: {},
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

const SessionDefaultData = {
  "class": "_Session",
  "items": [],
}

module.exports = { SessionScheme, SessionDefaultData };