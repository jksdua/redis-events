Redis Events
============

__Inter-process/inter-system event emitter__

Redis event emitter built against the Event Emitter API. It helps scale out code built using event emitters without having to change any app related code (well, a signle line of code!). Simply require `redis-events` instead of `events`.


It supports all the methods exposed by Node's built-in event emitters.


Usage
-----

### Example

```js
var EventEmitter = require('redis-events').EventEmitter;

// the following code stays exactly the same
var emitter = new EventEmitter();

emitter.on('msg', function(arg1, arg2, arg3) {});

emitter.emit('msg', 1, 2, 3);
```


### Options

An options object can be passed to the event emitter to provide Redis connection options. Supported options include `port`, `host` and `auth`. These are passed straight to the `node-redis` module.

#### Example

```js
var emitter = new EventEmitter({
	port: 12000,
	host: 'db-server.company.local'
});
```

#### Global defaults

To further assist the transition from using built-in event emitters to redis event emitters, the redis database options can be set globally once by editing the global defaults hash. Be careful when using this as it will apply these defaults application wide.

##### Example

```js
// emitter-defaults.js

var EventEmitter = require('redis-events').EventEmitter;

// change global defaults
	// make sure this file is require'd before any other file that relies on event emitters
EventEmitter.defaults = {
	port: 12000,
	host: 'db-server.company.local'
};
```

```js
// app.js

// nothing changes in this file except for the required module

var EventEmitter = require('redis-events').EventEmitter;

var emitter = new EventEmitter();
```

### Gotchas

The data structure of arguments passed needs to be supported by both `JSON.stringify` and Redis. So, be careful if using objects such as Errors, Functions or arguments as event args.


Changelog
---------

### v0.0.1
- Initial commit