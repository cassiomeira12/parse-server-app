const CredentialScheme = {
  className: "Credential",
  fields: {
    name: {
      type: "String",
      required: true,
    },
    userName: {
      type: "String",
      required: false,
    },
    password: {
      type: "String",
      require: false,
    },
    secretKeyOTP: {
      type: "String",
      required: false,
    },
    url: {
      type: "String",
      required: false,
    },
    faviconUrl: {
      ype: "String",
      required: false,
    },
    notes: {
      type: "String",
      required: false,
    }
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: true
    },
    find: {
      requiresAuthentication: true,
      "role:Admin": true
    },
    count: {
      requiresAuthentication: true,
      "role:Admin": true
    },
    create: {
      requiresAuthentication: true
    },
    update: {
      requiresAuthentication: true
    },
    delete: {
      requiresAuthentication: true
    },
  },
};

const CredentialDefaultData = {
  "class": "Credential",
  "items": [],
}

module.exports = { CredentialScheme, CredentialDefaultData };