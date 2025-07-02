const { RoleScheme, RoleDefaultData } = require('./role');
const { InstallationScheme, InstallationDefaultData } = require('./installation');
const { UserScheme, UserDefaultData } = require('./user');
const { UserDeletedScheme, UserDeletedDefaultData } = require('./user_deleted');
const { VersionAppScheme, VersionAppDefaultData } = require('./version_app');
const { TermsScheme, TermDefaultData } = require('./term');
const { UserTermsScheme, UserTermDefaultData } = require('./user_term');
const { PushNotificationScheme, PushNotificationDefaultData } = require('./push_notification');
const { NotificationScheme, NotificationDefaultData } = require('./notification');

const { SafetyContactScheme, SafetyContactDefaultData } = require('./sos/safety_contact');
const { OccurrenceScheme, OccurrenceDefaultData } = require('./sos/ocurrence');
const { UserSoSConfigScheme, UserSoSConfigDefaultData } = require('./sos/user_sos_config');

const schemes = [
  RoleScheme, // Default
  InstallationScheme, // Default
  UserScheme, // Default
  UserDeletedScheme, // Default
  VersionAppScheme, // Default
  // TermsScheme, // Default
  // UserTermsScheme, // Default
  PushNotificationScheme, // Default
  NotificationScheme, // Default
  //
  SafetyContactScheme,
  OccurrenceScheme,
  UserSoSConfigScheme,
];

const defaultData = [
  RoleDefaultData, // Default
  InstallationDefaultData, // Default
  UserDefaultData, // Default
  UserDeletedDefaultData, // Default
  VersionAppDefaultData, // Default
  // TermDefaultData, // Default
  // UserTermDefaultData, // Default
  PushNotificationDefaultData, // Default
  NotificationDefaultData, // Default
  //
  SafetyContactDefaultData,
  OccurrenceDefaultData,
  UserSoSConfigDefaultData,
];

module.exports = { schemes, defaultData };