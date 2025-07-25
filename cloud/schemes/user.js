const UserScheme = {
  className: "_User",
  fields: {
    name: {
      type: "String",
      required: true,
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
      "role:Admin": true
    },
  },
};

const UserDefaultData = {
  "class": "_User",
  "items": [
    {
      "username": "admin@email.com",
      "email": "admin@email.com",
      "password": "123456",
      "name": "Admin",
    }
  ],
}

module.exports = { UserScheme, UserDefaultData };