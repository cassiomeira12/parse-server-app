const CardBankScheme = {
  className: "CardBank",
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

const CardBankDefaultData = {
  "class": "CardBank",
  "items": [],
}

module.exports = { CardBankScheme, CardBankDefaultData };