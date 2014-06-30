/* jshint node:true */
/* globals describe, it */

'use strict';

var chai = require('chai');
var expect = chai.expect;

var events = require(__dirname);

describe('#redis-events', function() {

	it('should work for one event', function(done) {
		var emitter = new events.EventEmitter();
		var seen = 0;

		emitter.on('msg', function(lvl, msg) {
			seen += 1;
			expect(['info', 'error']).to.contain(lvl);

			if (seen === 2) {
				done();
			}
		});

		emitter.subscriber.on('subscribe', function() {
			emitter.emit('msg', 'info', 'this is an informational message');
			emitter.emit('msg', 'error', 'this is an error message');
		});
	});

	// issue - https://github.com/jksdua/redis-events/issues/2
	it('should work for multiple events', function(done) {
		var emitter = new events.EventEmitter();
		var seen = 0;

		emitter.on('bla.msg', function(arg1, arg2) {
			seen += 1;
			expect(arg1).to.equal('bla1');
			expect(arg2).to.equal(1);

			if (seen === 2) {
				done();
			}
		});

		emitter.on('foo.msg', function(arg1, arg2) {
			seen += 1;
			expect(arg1).to.eql({ foo: 'baz' });
			expect(arg2).to.equal(2);

			if (seen === 2) {
				done();
			}
		});

		emitter.emit('bla.msg', 'bla1', 1);
		emitter.emit('foo.msg', { foo: 'baz' }, 2);
	});

	it('should only call listener once for local event', function() {

	});
});