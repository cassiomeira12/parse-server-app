const ProductCategoryScheme = {
  className: "ProductCategory",
  fields: {
    name: {
      type: "String",
      require: true,
    },
    company: {
      type: "Pointer",
      targetClass: "Company",
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

const ProductCategoryDefaultData = {
  "class": "ProductCategory",
  "items": [],
}

module.exports = { ProductCategoryScheme, ProductCategoryDefaultData };