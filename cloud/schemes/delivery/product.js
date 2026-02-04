const ProductScheme = {
  className: "Product",
  fields: {
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
    status: {
      type: "Pointer",
      targetClass: "ProductStatus",
      require: false,
    },
    category: {
      type: "Pointer",
      targetClass: "ProductCategory",
      require: false,
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

const ProductDefaultData = {
  "class": "Product",
  "items": [],
}

module.exports = { ProductScheme, ProductDefaultData };