const OrderStatusScheme = {
  className: "OrderStatus",
  fields: {
    index: {
      type: "Number",
      require: true,
    },
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

const OrderStatusDefaultData = {
  "class": "OrderStatus",
  "items": [
    {
      "index": 1,
      "name": "Recebido",
    },
    {
      "index": 2,
      "name": "Aceito",
    },
    {
      "index": 3,
      "name": "Em preparo",
    },
    {
      "index": 4,
      "name": "Aguardando envio",
    },
    {
      "index": 5,
      "name": "Saiu pra entrega",
    },
    {
      "index": 6,
      "name": "Entregue",
    },
    {
      "index": 1,
      "name": "Pedido não entregue",
    },
    {
      "index": 0,
      "name": "Cancelado por cliente",
    },
    {
      "index": 0,
      "name": "Cancelado pela empresa",
    }
  ],
}

module.exports = { OrderStatusScheme, OrderStatusDefaultData };