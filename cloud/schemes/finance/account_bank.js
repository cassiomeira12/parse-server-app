const AccountBankScheme = {
  className: "AccountBank",
  fields: {
    name: {
      type: "String",
      required: true,
    }
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: true
    },
    find: {
      requiresAuthentication: true
    },
    count: {
      requiresAuthentication: true
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

const AccountBankDefaultData = {
  "class": "AccountBank",
  "items": [],
}

module.exports = { AccountBankScheme, AccountBankDefaultData };