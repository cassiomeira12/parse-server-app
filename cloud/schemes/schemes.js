const { RoleScheme, RoleDefaultData } = require('./role');
const { InstallationScheme, InstallationDefaultData } = require('./installation');
const { SessionScheme, SessionDefaultData } = require('./session');
const { UserScheme, UserDefaultData } = require('./user');
const { UserDeletedScheme, UserDeletedDefaultData } = require('./user_deleted');
const { VersionAppScheme, VersionAppDefaultData } = require('./version_app');
const { TermsScheme, TermDefaultData } = require('./term');
const { UserTermsScheme, UserTermDefaultData } = require('./user_term');
const { PushNotificationScheme, PushNotificationDefaultData } = require('./push_notification');
const { NotificationScheme, NotificationDefaultData } = require('./notification');
const { WebsiteVisitHistoryScheme, WebsiteVisitHistoryDefaultData } = require('./website_visit_history');

const { WorkPointScheme, WorkPointDefaultData } = require('./work_point');
const { WorkDayScheme, WorkDayDefaultData } = require('./work_day');

const schemes = [
  RoleScheme, // Default
  InstallationScheme, // Default
  SessionScheme, // Default
  UserScheme, // Default
  UserDeletedScheme, // Default
  VersionAppScheme, // Default
  // TermsScheme, // Default
  // UserTermsScheme, // Default
  PushNotificationScheme, // Default
  NotificationScheme, // Default
  WebsiteVisitHistoryScheme, // Default
  //
  WorkPointScheme,
  WorkDayScheme,
];

const defaultData = [
  RoleDefaultData, // Default
  InstallationDefaultData, // Default
  SessionDefaultData, // Default
  UserDefaultData, // Default
  UserDeletedDefaultData, // Default
  VersionAppDefaultData, // Default
  // TermDefaultData, // Default
  // UserTermDefaultData, // Default
  PushNotificationDefaultData, // Default
  NotificationDefaultData, // Default
  WebsiteVisitHistoryDefaultData, // Default
  //
  WorkPointDefaultData,
  WorkDayDefaultData
];

module.exports = { schemes, defaultData };