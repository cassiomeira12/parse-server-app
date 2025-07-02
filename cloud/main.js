require('./installation/installation');
require('./triggers');
require('./user/user');
require('./login/login');
require('./login/signup');
require('./roles');
require('./jobs');
require('./push_notification/push_notification');
require('./notification/notification');
require('./web_visit_history/web_visit_history');

require('./security/encrypt/encrypt');
require('./security/otp/otp');

require('./sos/occurrence');
require('./sos/safety_contact');
require('./sos/user_sos_config');
require('./sos/whatsapp/whatsapp_functions');
require('./sos/whatsapp/whatsapp_two_factor_authentication');

module.exports.app = require('./app');
