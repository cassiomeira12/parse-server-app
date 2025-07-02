const NotificationScheme = {
  className: "Notification",
  fields: {
    sender: {
      type: "Pointer",
      targetClass: "_User",
    },
    recipient: {
      type: "Pointer",
      targetClass: "_User",
    },
    title: {
      type: "String",
      required: true,
    },
    body: {
      type: "String",
      require: true,
    },
    imageUrl: {
      type: "String",
      require: false,
    },
    data: {
      type: "String",
      require: false,
    },
    viewed: {
      type: "Boolean",
      require: true,
      defaultValue: false
    },
    pushNotifications: {
      type: "Relation",
      targetClass: "PushNotification",
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
      requiresAuthentication: true,
      "role:Admin": true
    },
    create: {
      requiresAuthentication: true
    },
    update: {
      requiresAuthentication: true
    },
    delete: {
      "role:Admin": true
    },
  },
};

const NotificationDefaultData = {
  "class": "Notification",
  "items": [],
}

module.exports = { NotificationScheme, NotificationDefaultData };