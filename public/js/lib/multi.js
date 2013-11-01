
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/


define('../shared/eventDispatcher',['require','exports','module'],function(require, exports, module) {

	/**
	 * @classdesc Simple event dispatcher from
	 * {@link http://motionharvest.com/2013/02/01/custom-events/}
	 * @mixin
	 * @class
	 */
	exports.EventDispatcher = function () {
		/** 
		 * Map of all currently added callback functions mapped 
		 * to their corresponding events.
		 * @private
		 */
		this.events = {};
	};

	/**
	 * Adds a callback function to the given event.
	 * @param {string}                                      key
	 *  event that should trigger the callback
	 * @param {EventDispatcher.eventCallback} func
	 *  callback that should be called when event is fired
	 */
	exports.EventDispatcher.prototype.on = function (key, func) {
		if (!this.events.hasOwnProperty(key)) {
			this.events[key] = [];
		}
		this.events[key].push(func);
	};

	/**
	 * Removes a callback function from the given event.
	 * @param {string}                                      key
	 *  event that should trigger the callback
	 * @param {EventDispatcher.eventCallback} [func]
	 *  callback that should be removed. If none provided all callbacks 
	 *  will be removed.
	 */
	exports.EventDispatcher.prototype.off = function (key, func) {
		if (this.events.hasOwnProperty(key)) {
			if (func === undefined) {
				delete this.events[key];
			} else {
				for (var i in this.events[key]) {
					if (this.events[key][i] === func) {
						this.events[key].splice(i, 1);
					}
				}
			}
		}
	};

	/**
	 * Adds a callback function to the given event. The callback
	 * is only called one and then removed from the given event.
	 * @param {string}                                      key
	 *  event that should trigger the callback
	 * @param {EventDispatcher.eventCallback} func
	 *  callback that should be called when event is fired
	 */
	exports.EventDispatcher.prototype.once = function (key, func) {
		var that = this;
		function callback(dataObj) {
			that.off(key, callback);
			func(dataObj);
		}
		this.on(key, callback);
	};

	/**
	 * Fires the given event and calls all its associated callbacks.
	 * @param {string} key           event that should be triggered
	 * @param {object} [dataObj={}]  any object containing more event 
	 * information you wish to add
	 */
	exports.EventDispatcher.prototype.dispatchEvent = function (key, dataObj) {
		if (this.events.hasOwnProperty(key)) {
			dataObj = dataObj || {};
			dataObj.currentTarget = this;
			for (var i in this.events[key]) {
				this.events[key][i](dataObj);
			}
		}
	};

	/**
	 * Generic event callback.
	 * @callback EventDispatcher.eventCallback
	 * @param {object} event  object containing event information
	 */

	return exports.EventDispatcher;
 });
/**
 * DEVELOPED BY
 * GIL LOPES BUENO
 * gilbueno.mail@gmail.com
 *
 * WORKS WITH:
 * IE 9+, FF 4+, SF 5+, WebKit, CH 7+, OP 12+, BESEN, Rhino 1.7+
 *
 * FORK:
 * https://github.com/melanke/Watch.JS
 */


(function (factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('../debs/watch',factory);
    } else {
        // Browser globals
        window.WatchJS = factory();
        window.watch = window.WatchJS.watch;
        window.unwatch = window.WatchJS.unwatch;
        window.callWatchers = window.WatchJS.callWatchers;
    }
}(function () {

    var WatchJS = {
        noMore: false
    },
    lengthsubjects = [];

    var isFunction = function (functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) == '[object Function]';
    };

    var isInt = function (x) {
        return x % 1 === 0;
    };

    var isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    var getObjDiff = function(a, b){
        var aplus = [],
        bplus = [];

        if(!(typeof a == "string") && !(typeof b == "string") && !isArray(a) && !isArray(b)){

            for(var i in a){
                if(b[i] === undefined){
                    aplus.push(i);
                }
            }

            for(var j in b){
                if(a[j] === undefined){
                    bplus.push(j);
                }
            }
        }

        return {
            added: aplus,
            removed: bplus
        }
    };

    var clone = function(obj){

        if (null == obj || "object" != typeof obj) {
            return obj;
        }

        var copy = obj.constructor();

        for (var attr in obj) {
            copy[attr] = obj[attr];
        }

        return copy;

    }

    var defineGetAndSet = function (obj, propName, getter, setter) {
        try {

            Object.observe(obj[propName], function(data){
                setter(data); //TODO: adapt our callback data to match Object.observe data spec
            }); 

        } catch(e) {

            try {
                    Object.defineProperty(obj, propName, {
                            get: getter,
                            set: setter,
                            enumerable: true,
                            configurable: true
                    });
            } catch(e2) {
                try{
                    Object.prototype.__defineGetter__.call(obj, propName, getter);
                    Object.prototype.__defineSetter__.call(obj, propName, setter);
                } catch(e3) {
                    throw new Error("watchJS error: browser not supported :/")
                }
            }

        }
    };

    var defineProp = function (obj, propName, value) {
        try {
            Object.defineProperty(obj, propName, {
                enumerable: false,
                configurable: true,
                writable: false,
                value: value
            });
        } catch(error) {
            obj[propName] = value;
        }
    };

    var watch = function () {

        if (isFunction(arguments[1])) {
            watchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            watchMany.apply(this, arguments);
        } else {
            watchOne.apply(this, arguments);
        }

    };


    var watchAll = function (obj, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        var props = [];


        if(isArray(obj)) {
            for (var prop = 0; prop < obj.length; prop++) { //for each item if obj is an array
                props.push(prop); //put in the props
            }
        } else {
            for (var prop2 in obj) { //for each attribute if obj is an object
                props.push(prop2); //put in the props
            }
        }

        watchMany(obj, props, watcher, level, addNRemove); //watch all itens of the props

        if (addNRemove) {
            pushToLengthSubjects(obj, "$$watchlengthsubjectroot", watcher, level);
        }
    };


    var watchMany = function (obj, props, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        for (var prop in props) { //watch each attribute of "props" if is an object
            watchOne(obj, props[prop], watcher, level, addNRemove);
        }

    };

    var watchOne = function (obj, prop, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        if(isFunction(obj[prop])) { //dont watch if it is a function
            return;
        }

        if(obj[prop] != null && (level === undefined || level > 0)){
            if(level !== undefined){
                level--;
            }
            watchAll(obj[prop], watcher, level); //recursively watch all attributes of this
        }

        defineWatcher(obj, prop, watcher);

        if(addNRemove){
            pushToLengthSubjects(obj, prop, watcher, level);
        }

    };

    var unwatch = function () {

        if (isFunction(arguments[1])) {
            unwatchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            unwatchMany.apply(this, arguments);
        } else {
            unwatchOne.apply(this, arguments);
        }

    };

    var unwatchAll = function (obj, watcher) {

        if (obj instanceof String || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        var props = [];


        if (isArray(obj)) {
            for (var prop = 0; prop < obj.length; prop++) { //for each item if obj is an array
                props.push(prop); //put in the props
            }
        } else {
            for (var prop2 in obj) { //for each attribute if obj is an object
                props.push(prop2); //put in the props
            }
        }

        unwatchMany(obj, props, watcher); //watch all itens of the props
    };


    var unwatchMany = function (obj, props, watcher) {

        for (var prop2 in props) { //watch each attribute of "props" if is an object
            unwatchOne(obj, props[prop2], watcher);
        }
    };

    var defineWatcher = function (obj, prop, watcher) {

        var val = obj[prop];

        watchFunctions(obj, prop);

        if (!obj.watchers) {
            defineProp(obj, "watchers", {});
        }

        if (!obj.watchers[prop]) {
            obj.watchers[prop] = [];
        }

        for(var i in obj.watchers[prop]){
            if(obj.watchers[prop][i] === watcher){
                return;
            }
        }


        obj.watchers[prop].push(watcher); //add the new watcher in the watchers array


        var getter = function () {
            return val;
        };


        var setter = function (newval) {
            var oldval = val;
            val = newval;

            if (obj[prop]){
                watchAll(obj[prop], watcher);
            }

            watchFunctions(obj, prop);

            if (!WatchJS.noMore){
                if (JSON.stringify(oldval) !== JSON.stringify(newval)) {
                    callWatchers(obj, prop, "set", newval, oldval);
                    WatchJS.noMore = false;
                }
            }
        };

        defineGetAndSet(obj, prop, getter, setter);

    };

    var callWatchers = function (obj, prop, action, newval, oldval) {
        if (prop) {
            for (var wr in obj.watchers[prop]) {
                if (isInt(wr)) {
                    obj.watchers[prop][wr].call(obj, prop, action, newval || obj[prop], oldval);
                }
            }
        } else {
            for (var prop in obj) {//call all
                callWatchers(obj, prop, action, newval, oldval);
            }
        }
    };

    // @todo code related to "watchFunctions" is certainly buggy
    var methodNames = ['pop', 'push', 'reverse', 'shift', 'sort', 'slice', 'unshift'];
    var defineArrayMethodWatcher = function (obj, prop, original, methodName) {
        defineProp(obj[prop], methodName, function () {
            var response = original.apply(obj[prop], arguments);
            watchOne(obj, obj[prop]);
            if (methodName !== 'slice') {
                callWatchers(obj, prop, methodName,arguments);
            }
            return response;
        });
    };

    var watchFunctions = function(obj, prop) {

        if ((!obj[prop]) || (obj[prop] instanceof String) || (!isArray(obj[prop]))) {
            return;
        }

        for (var i = methodNames.length, methodName; i--;) {
            methodName = methodNames[i];
            defineArrayMethodWatcher(obj, prop, obj[prop][methodName], methodName);
        }

    };

    var unwatchOne = function (obj, prop, watcher) {
        for(var i in obj.watchers[prop]){
            var w = obj.watchers[prop][i];

            if(w == watcher) {
                obj.watchers[prop].splice(i, 1);
            }
        }

        removeFromLengthSubjects(obj, prop, watcher);
    };

    var loop = function(){

        for(var i in lengthsubjects){

            var subj = lengthsubjects[i];

            if (subj.prop === "$$watchlengthsubjectroot") {

                var difference = getObjDiff(subj.obj, subj.actual);

                if(difference.added.length || difference.removed.length){
                    if(difference.added.length){
                        watchMany(subj.obj, difference.added, subj.watcher, subj.level - 1, true);
                    }

                    subj.watcher.call(subj.obj, "root", "differentattr", difference, subj.actual);
                }
                subj.actual = clone(subj.obj);


            } else {

                var difference = getObjDiff(subj.obj[subj.prop], subj.actual);
            
                if(difference.added.length || difference.removed.length){
                    if(difference.added.length){
                        for(var j in subj.obj.watchers[subj.prop]){
                            watchMany(subj.obj[subj.prop], difference.added, subj.obj.watchers[subj.prop][j], subj.level - 1, true);
                        }
                    }

                    callWatchers(subj.obj, subj.prop, "differentattr", difference, subj.actual);
                }

                subj.actual = clone(subj.obj[subj.prop]);

            }

        }

    };

    var pushToLengthSubjects = function(obj, prop, watcher, level){
        
        var actual;

        if (prop === "$$watchlengthsubjectroot") {
            actual =  clone(obj);
        } else {
            actual = clone(obj[prop]);
        }

        lengthsubjects.push({
            obj: obj,
            prop: prop,
            actual: actual,
            watcher: watcher,
            level: level
        });
    };

    var removeFromLengthSubjects = function(obj, prop, watcher){

        for (var i in lengthsubjects) {
            var subj = lengthsubjects[i];

            if (subj.obj == obj && subj.prop == prop && subj.watcher == watcher) {
                lengthsubjects.splice(i, 1);
            }
        }

    };

    setInterval(loop, 50);

    WatchJS.watch = watch;
    WatchJS.unwatch = unwatch;
    WatchJS.callWatchers = callWatchers;

    return WatchJS;

}));

/**
* Collection of util functions.
* @module client/util
*/

define('util',['require','exports','module'],function(require, exports, module) {

	/**
	* Inherit the prototype methods from one constructor into another.
	* <br/><br/>
	* From the node.js util package. See {@link https://github.com/joyent/node/blob/master/lib/util.js#L566 https://github.com/joyent/node/blob/master/lib/util.js}
	*
	* @param {function} ctor Constructor function which needs to inherit the
	* prototype.
	* @param {function} superCtor Constructor function to inherit prototype from.
	*/
	exports.inherits = function(ctor, superCtor) {
		ctor.super_ = superCtor;
		ctor.prototype = Object.create(superCtor.prototype, {
			constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
	};

});
/**
 * @module client/player
 * @private
 */
 
define('player',['require','exports','module','../shared/eventDispatcher','../debs/watch','util'],function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var WatchJS = require('../debs/watch');
	var util = require('util');

	/**
	* @inner
	* @class
	* @mixes EventDispatcher
	* @memberof module:client/player
	*/
	var Player = function () {
		var player = this;

		EventDispatcher.call(this);
		this.id = null;
		this.attributes = { color: null };

		/** 
		 * Called when the user attributes have been changed.
		 * @param {string} prop      property that has been changed
		 * @param {string} action    what has been done to the property
		 * @param          newvalue  new value of the changed property
		 * @param          oldvalue  old value of the changed property
		 */
		function onAttributesChange(prop, action, newvalue, oldvalue) {
			// console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue);
			player.dispatchEvent('attributesChangedLocally');
		}

		WatchJS.watch(this.attributes, onAttributesChange, 0, true);
	};

	util.inherits(Player, EventDispatcher);

	Player.prototype.updateAttributesFromServer = function (val) {
		WatchJS.noMore = true;
		for (var i in val) {
			this.attributes[i] = val[i];
		}
		this.dispatchEvent('attributesChanged');
		WatchJS.noMore = false;
	};

	/**
	* Unpacks a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.fromPackedData = function (data) {
		var player = new Player();
		for (var i in data) {
			if (i === 'attributes') {
				for (var j in data[i]) {
					player.attributes[j] = data[i][j];
				}
			} else {
				player[i] = data[i];
			}
		}
		return player;
	};

	return exports;

});
/**
 * @module client/session
 * @private
 */

define('session',['require','exports','module','../shared/eventDispatcher','./player','util'],function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var playerModule = require('./player');
	var util = require('util');

	/**
	* @inner
	* @class
	* @mixes EventDispatcher
	* @memberof module:client/session
	*/
	var Session = function (myself, socket) {

		EventDispatcher.call(this);
		var session = this;

		this.players = {};
		this.myself = myself;
		this.socket = socket;

		function onAttributesChangedLocally(event) {
			var player = event.currentTarget;
			socket.emit('playerAttributesChanged', 
				{ id: player.id, attributes: player.attributes }
			);
		}

		myself.on('attributesChangedLocally', onAttributesChangedLocally);

		socket.on('playerJoined', function (data) {
			var player = playerModule.fromPackedData(data);
			session.players[player.id] = player;
			session.dispatchEvent('playerJoined', { player: player });
			player.on('attributesChangedLocally', onAttributesChangedLocally);
		});

		socket.on('playerLeft', function (data) {
			var player = session.players[data.playerId];
			delete session.players[data.playerId];
			session.dispatchEvent('playerLeft', { player: player });
			player.dispatchEvent('disconnected');
		});

		socket.on('disconnect', function (data) {
			session.dispatchEvent('destroyed');
			session.socket = null;
		});

		socket.on('playerAttributesChanged', function (data) {
			var player = session.players[data.id];
			if (player === undefined && data.id === session.myself.id) {
				player = session.myself;
			}
			if (player === undefined) {
				console.error('player not found', data.id);
			} else {
				player.updateAttributesFromServer(data.attributes);
			}
		});
	};

	util.inherits(Session, EventDispatcher);

	/**
	* Unpacks a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.fromPackedData = function (data, socket) {
		var myself = playerModule.fromPackedData(data.player);
		var session = new Session(myself, socket);
		for (var i in data.session) {
			if (i === 'players') {
				var players = {};
				for (var j in data.session.players) {
					var player = playerModule.fromPackedData(data.session.players[j]);
					players[player.id] = player;
				}
				session.players = players;
			} else {
				session[i] = data.session[i];
			}
		}
		return session;
	};

	return exports;

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



/**
 * Here you can find some useful functions for working with colors.
 * @module
 */
define('../shared/color',['require','exports','module'],function(require, exports, module) {

	/**
	 * @returns {string} a random color string using the format '#RRGGBB'
	 */
	exports.random = function () {
		var color = 'ffff' + (Math.random()*0xFFFFFF<<0).toString(16);
		color = '#' + color.slice(-6);
		return color;
	};

	return exports;

 });
/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
*/

define('index',['require','exports','module','../shared/eventDispatcher','session','../shared/color','util'],function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var sessionModule = require('session');
	var color = require('../shared/color');
	var util = require('util');

	var instance = null;

	/**
	* @inner
	* @class
	* @memberof module:client/multi
	* @mixes EventDispatcher
	*/
	var Multi = function (options) {

		EventDispatcher.call(this);
		this.color = color;
		this.io = options.io;
		this.server = options.server;

		this.onSession = function (eventString, data, socket) {
			var session = sessionModule.fromPackedData(data, socket);
			var event = { session: session };
			this.dispatchEvent(eventString, event);
		};
	};

	util.inherits(Multi, EventDispatcher);

	function getSessionToken() {
		var sessionToken = window.location.hash.substring(1);

		if (sessionToken === undefined || sessionToken === '') {
			return null;
		} else {
			return sessionToken;
		}
	}

	Multi.prototype.autoJoinSession = function () {
		var sessionToken = getSessionToken();
		if (sessionToken !== null) {
			this.joinSession(sessionToken);
		}
	};

	/**
	 * @public
	 * @fires module:client/multi~Multi#sessionJoined
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		console.log('joining session', sessionToken);
		this.dispatchEvent('joiningSessionStarted', { token: sessionToken });
		var multi = this;
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('joinSession', { token: sessionToken });
			socket.on('sessionJoined', function (data) {
				multi.onSession('sessionJoined', data, socket);
			});
		});
		socket.on('connect_failed', function () {
			multi.dispatchEvent('joinSessionFailed', { reason: 'no connection' });
		});
		socket.on('joinSessionFailed', function () {
			multi.dispatchEvent('joinSessionFailed', { reason: 'no such session', token: sessionToken });
		});
	};

	/**
	 * @public
	 * @param {SessionOptions} options  to tweak the new sessions behaviour
	 * @fires module:client/multi~Multi#sessionCreated
	 */
	Multi.prototype.createSession = function (options) {
		console.log('creating new session');
		var multi = this;
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('createSession', { options: options });
			socket.on('sessionCreated', function (data) {
				multi.onSession('sessionCreated', data, socket);
			});
		});
		socket.on('connect_failed', function () {
			multi.dispatchEvent('createSessionFailed', { reason: 'no connection' });
		});
	};

	/**
	 * @event module:client/multi~Multi#sessionCreated
	 */

	/**
	 * @event module:client/multi~Multi#sessionJoined
	 */

	/**
	 * @public
	 * @returns {module:client/multi~Multi} the one and only Multi instance
	 */
	exports.init = function (options) {
		if (instance === null) {
			instance = new Multi(options);
			return instance;
		} else {
			throw 'only one call to init allowed';
		}
	};

	exports.color = color;

});
define(["index"], function(index) { return index; });