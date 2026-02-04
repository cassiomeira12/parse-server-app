const ProductOrderScheme = {
  className: "ProductOrder",
  fields: {
    quantity: {
      type: "Number",
      require: true,
    },
    name: {
      type: "String",
      require: true,
    },
    description: {
      type: "String",
    },
    price: {
      type: "Number",
      require: true,
    },
    discount: {
      type: "Number",
      require: false,
    },
    company: {
      type: "Pointer",
      targetClass: "Company",
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

const ProductOrderDefaultData = {
  "class": "ProductOrder",
  "items": [],
}

module.exports = { ProductOrderScheme, ProductOrderDefaultData };