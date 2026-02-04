const OrderScheme = {
  className: "Order",
  fields: {
    customer: {
      type: "String",
      require: true,
    },
    phoneNumber: {
      type: "String",
      require: false,
    },
    address: {
      type: "String",
      require: false,
    },
    addressGpsLocation: {
      type: "String",
      require: false,
    },
    items: {
      type: "Relation",
      targetClass: "ProductOrder",
      required: true,
    },
    note: {
      type: "String",
      require: false,
    },
    paymentType: {
      type: "Pointer",
      targetClass: "PaymentType",
      require: true,
    },
    paymentChange: {
      type: "String",
      require: false,
    },
    status: {
      type: "Pointer",
      targetClass: "OrderStatus",
      require: true,
    },
    deliveryMan: {
      type: "Pointer",
      targetClass: "_User",
      require: false,
    },
    attendant: {
      type: "Pointer",
      targetClass: "_User",
      require: true,
    },
    company: {
      type: "Pointer",
      targetClass: "Company",
      require: true,
    }
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

const OrderDefaultData = {
  "class": "Order",
  "items": [],
}

module.exports = { OrderScheme, OrderDefaultData };