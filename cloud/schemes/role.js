const RoleScheme = {
  className: "_Role",
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

const RoleDefaultData = {
  "class": "_Role",
  "items": [
    {
      "name": "Admin",
    }
  ],
}

module.exports = { RoleScheme, RoleDefaultData };