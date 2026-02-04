const ProductStatusScheme = {
  className: "ProductStatus",
  fields: {
    name: {
      type: "String",
      require: true,
    },
    enabled: {
      type: "Boolean",
      require: true,
    },
    showProduct: {
      type: "Boolean",
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

const ProductStatusDefaultData = {
  "class": "ProductStatus",
  "items": [
    {
      "name": "Ativo",
      "enabled": true,
      "showProduct": true,
    },
    {
      "name": "Inativo",
      "enabled": false,
      "showProduct": false,
    },
    {
      "name": "Em Falta",
      "enabled": true,
      "showProduct": false,
    }
  ],
}

module.exports = { ProductStatusScheme, ProductStatusDefaultData };