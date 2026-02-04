const CompanyScheme = {
  className: "Company",
  fields: {
    name: {
      type: "String",
      require: true,
    },
  },
  protectedFields: {
    "*": [],
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

const CompanyDefaultData = {
  "class": "Company",
  "items": [],
}

module.exports = { CompanyScheme, CompanyDefaultData };