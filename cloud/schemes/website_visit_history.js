const WebsiteVisitHistoryScheme = {
  className: "WebsiteVisitHistory",
  fields: {
    website: {
      type: "String",
      require: true,
    },
    ip: {
      type: "String",
      required: true,
    },
    userAgent: {
      type: "String",
      required: true,
    },
    country: {
      type: "String",
    },
    countryCode: {
      type: "String",
    },
    region: {
      type: "String",
    },
    regionName: {
      type: "String",
    },
    zip: {
      type: "String",
    },
    lat: {
      type: "Number",
    },
    lon: {
      type: "Number",
    },
    timezone: {
      type: "String",
    },
    isp: {
      type: "String",
    },
    org: {
      type: "String",
    },
    as: {
      type: "String",
    },
  },
  protectedFields: {
    "*": [],
  },
  classLevelPermissions: {
    get: {
      "role:Admin": true
    },
    find: {
      "role:Admin": true
    },
    count: {
      "role:Admin": true
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

const WebsiteVisitHistoryDefaultData = {
  "class": "WebsiteVisitHistory",
  "items": [],
}

module.exports = { WebsiteVisitHistoryScheme, WebsiteVisitHistoryDefaultData };