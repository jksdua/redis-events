/* jshint node:true */

'use strict';

var redis = require('redis');
var debug = require('debug')('redis-events');
var slice = Array.prototype.slice;
var EventEmitter = require('events').EventEmitter;

function extend(destination, source) {
	Object.keys(source).forEach(function(i) {
		destination[i] = destination[i] || source[i];
	});
	return destination;
}

function RedisEventEmitter(options) {
	if (!(this instanceof RedisEventEmitter)) {
		return new RedisEventEmitter(options);
	}

	EventEmitter.call(this);
	this.options = extend(options || {}, RedisEventEmitter.defaults);

	debug('Created event emitter with options: %j', options);
}

/**
	Default redis options - exposed so they can be edited as a means of setting global config
 */
RedisEventEmitter.defaults = {
	auth: null,
	port: 6379,
	host: 'localhost'
};

// node events module compatibility
RedisEventEmitter.EventEmitter = RedisEventEmitter;
// proxy to EventEmitter
['usingDomains', 'defaultMaxListeners', 'init', 'listenerCount'].forEach(function(property) {
	Object.defineProperty(RedisEventEmitter, property, {
		get: function() {
			return EventEmitter[property];
		},
		set: function(val) {
			EventEmitter[property] = val;
		}
	});
});

var proto = RedisEventEmitter.prototype = Object.create(EventEmitter.prototype);

/**
	Redis and pattern options
 */
proto.options = null;

/**
	Redis client used by .emit
 */
proto.publisher = null;

/**
	Redis client used by .on and .once
 */
proto.subscriber = null;

/**
	Creates a new redis client
 */
proto.createClient = function() {
	debug('Creating redis client');
	var client = redis.createClient(this.options.port, this.options.host);
	if (this.options.auth) {
		client.auth(this.options.auth);
	}
	return client;
};

/**
	Creates a redis subscriber if it doesn't exist and subscribes to the given event
 */
proto._subscribe = function(event) {
	// lazily creates a redis client
	if (!this.subscriber) {
		debug('Creating subscriber');
		this.subscriber = this.createClient();
		// add a listener for incoming messages and emit them to local listeners
		this._emitLocally();

		// listen for new subscribe event on redis client and adds a message handler for that event
		this.subscriber.on('subscribe', function(event) {
			debug('New subscription for event: %s', event);
		});
	}

	// only subscribes once
	var listeners = EventEmitter.listenerCount(this, event);
	if (!listeners) {
		debug('No existing listeners - sending subscribe command');
		this.subscriber.subscribe(event);
	}
};

/**
	Adds redis subscriber, then proxies to event emitter
 */
proto.addListener = function(event, listener) {
	debug('Adding listener for %s', event);
	this._subscribe(event);
	EventEmitter.prototype.on.call(this, event, listener);
};

proto.on = proto.addListener;

/**
	Adds redis subscriber, then proxies to event emitter
 */
proto.once = function(event, listener) {
	debug('Adding one time listener for %s', event);
	this._subscribe(event);
	EventEmitter.prototype.once.call(this, event, listener);
};

/**
	Emits an event to all the in-process attached listeners
 */
proto._emitLocally = function() {
	this.subscriber.on('message', function(event, msg) {
		var args = null, error = null;

		debug('Received message - event: %s, msg: %s', event, msg);

		try {
			args = JSON.parse(msg);
		} catch(e) {
			error = e;
			error.event = event;
			error.msg = msg;

			debug('Error while parsing message');
			EventEmitter.prototype.emit.call(this, 'error', error);
		}

		// emit to all the attached listeners
		args.unshift(event);
		EventEmitter.prototype.emit.apply(this, args);
	}.bind(this));
};

/**
	Adds a publisher, then proxies to event emitter
 */
proto.emit = function(event) {
	debug('Emitting event: %s', event);

	// following events dont make sense to be passed onto redis subscribers
	if (['error', 'newListener', 'removeListener'].indexOf(event) > -1) {
		EventEmitter.prototype.emit.apply(this, arguments);
	} else {
		// lazily creates a redis client
		this.publisher = this.publisher || this.createClient();

		var args = slice.call(arguments);
		args.shift(); // remove event from args

		debug('Publishing event: %s, args: %j', event, args);
		this.publisher.publish(event, JSON.stringify(args));
	}
};

module.exports = RedisEventEmitter;
