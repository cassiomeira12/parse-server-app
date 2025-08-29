const TransactionCategoryScheme = {
  className: "TransactionCategory",
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

const TransactionCategoryDefaultData = {
  "class": "TransactionCategory",
  "items": [
    {
      "name": "Alimentação",
    },
    {
      "name": "Assinatura/Serviços",
    },
    {
      "name": "Cuidado Pessoal",
    },
    {
      "name": "Dívidas/Empréstimos",
    },
    {
      "name": "Educação",
    },
    {
      "name": "Impostos/Taxas",
    },
    {
      "name": "Investimentos",
    },
    {
      "name": "Lazer/Hobbies",
    },
    {
      "name": "Moradia",
    },
    {
      "name": "Outros",
    },
    {
      "name": "Pets",
    },
    {
      "name": "Salário",
    },
    {
      "name": "Saúde",
    },
    {
      "name": "Supermercado",
    },
    {
      "name": "Transporte",
    },
    {
      "name": "Vestuário",
    },
    {
      "name": "Viagens",
    },
  ],
}

module.exports = { TransactionCategoryScheme, TransactionCategoryDefaultData };