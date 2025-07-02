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
    currentNameVersion: {
      type: "String",
      require: true,
    },
    currentBuildVersion: {
      type: "Number",
      required: true,
    },
    minimumBuildVersion: {
      type: "Number",
      required: true,
    },
    pushNotificationTopic: {
      type: "String",
      require: true,
    },
    downloadUrl: {
      type: "String",
      require: true,
    },
  },
  protectedFields: {
    "*": ["pushNotificationTopic"],
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