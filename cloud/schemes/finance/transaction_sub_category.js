const TransactionSubCategoryScheme = {
  className: "TransactionSubCategory",
  fields: {
    category: {
      type: "Pointer",
      targetClass: "TransactionCategory",
      required: true,
    },
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

const TransactionSubCategoryDefaultData = {
  "class": "TransactionSubCategory",
  "items": [],
}

module.exports = { TransactionSubCategoryScheme, TransactionSubCategoryDefaultData };