const VersionAppScheme = {
  className: "VersionApp",
  fields: {
    platform: {
      type: "String",
      require: true,
    },
    package: {
      type: "String",
      required: true,
    },
    nameVersion: {
      type: "String",
      require: true,
    },
    buildVersion: {
      type: "Number",
      required: true,
    },
    downloadUrl: {
      type: "String",
      require: true,
    },
  },
  protectedFields: {
    "*": ["downloadUrl"],
    "role:Admin": ["package"]
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

const VersionAppDefaultData = {
  "class": "VersionApp",
  "items": [],
}

module.exports = { VersionAppScheme, VersionAppDefaultData };