require('./installation/installation');
require('./functions');
require('./triggers');
require('./user/user');
require('./login/login');
require('./login/signup');
require('./roles');
require('./jobs');
require('./push_notification/push_notification');
require('./notification/notification');

module.exports.app = require('./app');
