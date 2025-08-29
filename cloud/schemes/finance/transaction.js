const TransactionScheme = {
  className: "Transaction",
  fields: {
    type: {
      type: "Pointer",
      targetClass: "TransactionType",
      required: true,
    },
    accountBank: {
      type: "Pointer",
      targetClass: "AccountBank",
      required: false,
    },
    cardBank: {
      type: "Pointer",
      targetClass: "CardBank",
      required: false,
    },
    category: {
      type: "Pointer",
      targetClass: "TransactionCategory",
      required: true,
    },
    subCategory: {
      type: "Pointer",
      targetClass: "TransactionSubCategory",
      required: false,
    },
    date: {
      type: "Date",
      required: true,
    },
    value: {
      type: "Number",
      required: true,
    },
    description: {
      type: "String",
      required: true,
    },
    notes: {
      type: "String",
      required: false,
    },
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

const TransactionDefaultData = {
  "class": "Transaction",
  "items": [],
}

module.exports = { TransactionScheme, TransactionDefaultData };