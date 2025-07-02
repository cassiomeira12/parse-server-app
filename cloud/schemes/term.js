const TermScheme = {
  className: "Term",
  fields: {
    name: {
      type: "String",
      required: true,
    },
    html: {
      type: "String",
      required: true,
    },
    locale: {
      type: "String",
      require: false,
    },
    version: {
      type: "Number",
      required: true,
    },
    required: {
      type: "Boolean",
      required: true,
    }
  },
  classLevelPermissions: {
    get: {
      requiresAuthentication: false
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

const TermDefaultData = {
  "class": "Term",
  "items": [],
}

module.exports = { TermScheme, TermDefaultData };