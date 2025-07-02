const PushNotificationScheme = {
  className: "PushNotification",
  fields: {
    GCMSenderId: {
      type: "String",
      required: true,
    },
    data: {
      type: "String",
      required: true,
    },
    messageId: {
      type: "String",
      required: false,
    },
    token: {
      type: "String",
      required: false,
    },
    topic: {
      type: "String",
      required: false,
    },
    delivered: {
      type: "Boolean",
      required: false,
    },
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

const PushNotificationDefaultData = {
  "class": "PushNotification",
  "items": [],
}

module.exports = { PushNotificationScheme, PushNotificationDefaultData };