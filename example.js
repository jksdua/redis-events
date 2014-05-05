/* jshint node:true */

'use strict';

var events = require(__dirname);

var emitter = new events.EventEmitter();

emitter.on('msg', function(lvl, msg) {
	console.log('[%s] %s', lvl, msg);
});

emitter.subscriber.on('subscribe', function() {
	emitter.emit('msg', 'info', 'this is an informational message');
	emitter.emit('msg', 'error', 'this is an error message');
});