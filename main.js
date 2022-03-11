var server = require('./server');
var router =require('./router');
var handler = require('./handler');

var handle = {};
handle['/start'] = handler.start,
handle['/qrcode'] = handler.qrcode,
handle['/upload'] = handler.upload;
handle['/robotState'] = handler.robotState;

server.start(router.route, handle);