const TransactionTypeScheme = {
  className: "TransactionType",
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

const TransactionTypeDefaultData = {
  "class": "TransactionType",
  "items": [
    {
      "name": "Crédito",
    },
    {
      "name": "Débito",
    },
    {
      "name": "Transferência",
    }
  ],
}

module.exports = { TransactionTypeScheme, TransactionTypeDefaultData };