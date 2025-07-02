const InstallationScheme = {
  className: "_Installation",
  fields: {
    ip: {
      type: "String",
      required: true,
    },
    deviceId: {
      type: "String",
      required: true,
    },
    platform: {
      type: "String",
      required: true,
    },
    deviceBrand: {
      type: "String",
      required: true,
    },
    deviceOsVersion: {
      type: "String",
      require: true,
    },
    pushStatus: {
      type: "String",
      require: true,
      defaultValue: "INSTALLED"
    },
    platform: {
      type: "String",
      require: true,
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

const InstallationDefaultData = {
  "class": "_Installation",
  "items": [],
}

module.exports = { InstallationScheme, InstallationDefaultData };