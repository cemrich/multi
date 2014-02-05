
/**
* Simple wrapper, so you can require('events') on client side
* without using browserify.
* @module client/events
*/

define('events',['require','exports','module','socket.io'],function(require, exports, module) {
	'use strict';

	/**
	 * @classdesc EventEmitter from from socket.io
	 * @mixin
	 * @class
	 * @see {@link https://github.com/LearnBoost/socket.io-client/blob/master/lib/emitter.js}
	 */
	exports.EventEmitter = require('socket.io').EventEmitter;

});
/**
* Collection of util functions and required polyfills.
* @module client/util
*/

define('util',['require','exports','module','socket.io'],function(require, exports, module) {
	'use strict';

	/**
	* Inherit the prototype methods from one constructor into another.
	* <br/><br/>
	* From the socket.io util package. See {@link https://github.com/LearnBoost/socket.io-client}
	*
	* @param {function} ctor Constructor function which needs to inherit the
	* prototype.
	* @param {function} superCtor Constructor function to inherit prototype from.
	* @example
	* var ChildClass = function () {
	*   SuperClass.apply(this, arguments);
	*   this.name = 'childClass';
	* };
	* util.inherits(ChildClass, SuperClass);
	*/
	exports.inherits = require('socket.io').util.inherit;


	/* Function.bind-polyfill from 
	* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
	* This is needed to support older browsers without proper
	* ECMAScript 5.1 support. Especially PhantomJS that's running
	* the tests of this project will throw errors without this
	* polyfill.
	* See https://groups.google.com/forum/#!msg/phantomjs/r0hPOmnCUpc/uxusqsl2LNoJ
	*/
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== 'function') {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}

			var aArgs = Array.prototype.slice.call(arguments, 1);
			var fToBind = this;
			var FNOP = function () {};
			var fBound = function () {
				var isValid = this instanceof FNOP && oThis;
				return fToBind.apply(isValid ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

			FNOP.prototype = this.prototype;
			fBound.prototype = new FNOP();

			return fBound;
		};
	}

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

"use strict";
(function (factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('../lib/watch',factory);
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

        if(!(typeof a == "string") && !(typeof b == "string")){

            if (isArray(a)) {
                for (var i=0; i<a.length; i++) {
                    if (b[i] === undefined) aplus.push(i);
                }
            } else {
                for(var i in a){
                    if (a.hasOwnProperty(i)) {
                        if(b[i] === undefined) {
                            aplus.push(i);
                        }
                    }
                }
            }

            if (isArray(b)) {
                for (var j=0; j<b.length; j++) {
                    if (a[j] === undefined) bplus.push(j);
                }
            } else {
                for(var j in b){
                    if (b.hasOwnProperty(j)) {
                        if(a[j] === undefined) {
                            bplus.push(j);
                        }
                    }
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
                if (obj.hasOwnProperty(prop2)) {
                    props.push(prop2); //put in the props
                }
            }
        }

        watchMany(obj, props, watcher, level, addNRemove); //watch all items of the props

        if (addNRemove) {
            pushToLengthSubjects(obj, "$$watchlengthsubjectroot", watcher, level);
        }
    };


    var watchMany = function (obj, props, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        for (var prop in props) { //watch each attribute of "props" if is an object
            if (props.hasOwnProperty(prop)) {
                watchOne(obj, props[prop], watcher, level, addNRemove);
            }
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
            watchAll(obj[prop], watcher, level!==undefined? level-1 : level); //recursively watch all attributes of this
        }

        defineWatcher(obj, prop, watcher, level);

        if(addNRemove && (level === undefined || level > 0)){
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
                if (obj.hasOwnProperty(prop2)) {
                    props.push(prop2); //put in the props
                }
            }
        }

        unwatchMany(obj, props, watcher); //watch all itens of the props
    };


    var unwatchMany = function (obj, props, watcher) {

        for (var prop2 in props) { //watch each attribute of "props" if is an object
            if (props.hasOwnProperty(prop2)) {
                unwatchOne(obj, props[prop2], watcher);
            }
        }
    };

    var defineWatcher = function (obj, prop, watcher, level) {

        var val = obj[prop];

        watchFunctions(obj, prop);

        if (!obj.watchers) {
            defineProp(obj, "watchers", {});
        }

        if (!obj.watchers[prop]) {
            obj.watchers[prop] = [];
        }

        for (var i=0; i<obj.watchers[prop].length; i++) {
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

            if (level !== 0 && obj[prop]){
                // watch sub properties
                watchAll(obj[prop], watcher, (level===undefined)?level:level-1);
            }

            watchFunctions(obj, prop);

            if (!WatchJS.noMore){
                //if (JSON.stringify(oldval) !== JSON.stringify(newval)) {
                if (oldval !== newval) {
                    callWatchers(obj, prop, "set", newval, oldval);
                    WatchJS.noMore = false;
                }
            }
        };

        defineGetAndSet(obj, prop, getter, setter);

    };

    var callWatchers = function (obj, prop, action, newval, oldval) {
        if (prop) {
            for (var wr=0; wr<obj.watchers[prop].length; wr++) {
                obj.watchers[prop][wr].call(obj, prop, action, newval, oldval);
            }
        } else {
            for (var prop in obj) {//call all
                if (obj.hasOwnProperty(prop)) {
                    callWatchers(obj, prop, action, newval, oldval);
                }
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
        for (var i=0; i<obj.watchers[prop].length; i++) {
            var w = obj.watchers[prop][i];

            if(w == watcher) {
                obj.watchers[prop].splice(i, 1);
            }
        }

        removeFromLengthSubjects(obj, prop, watcher);
    };

    var loop = function(){

        for(var i=0; i<lengthsubjects.length; i++) {

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
                        for (var j=0; j<subj.obj.watchers[subj.prop].length; j++) {
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

        for (var i=0; i<lengthsubjects.length; i++) {
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

// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define('../lib/q',definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
// engine that has a deployed base of browsers that support generators.
// However, SM's generators use the Python-inspired semantics of
// outdated ES6 drafts.  We would like to support ES6, but we'd also
// like to make it possible to use generators in deployed browsers, so
// we also support Python-style generators.  At some point we can remove
// this block.
var hasES6Generators;
try {
    /* jshint evil: true, nonew: false */
    new Function("(function* (){ yield 1; })");
    hasES6Generators = true;
} catch (e) {
    hasES6Generators = false;
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        console.warn("Unhandled rejection reason:", reason);
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            if (hasES6Generators) {
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



define('../shared/SyncedObject',['require','exports','module','../lib/watch','../lib/q','events','util'],function(require, exports, module) {
	'use strict';

	var WatchJS = require('../lib/watch');
	var Q = require('../lib/q');
	var EventEmitter = require('events').EventEmitter;
	var util = require('util');

	/**
	 * @typedef Changeset
	 * This object describes changes made to the attributes inside the wrapped
	 * object.
	 * @memberOf SyncedObject
	 * @property {Object.<string, *>} changed  any changed top level attributes:
	 * their new value mapped to their name
	 * @property {Array.<string>} removed  names of all top level
	 * attributes that have been deleted
	 */

	/**
	 * @classdesc This class wraps an object and detects when it is changed from
	 * the outside world.
	 * @example
	 * var synced = new SyncedObject();
	 * synced.on('changed', function (changeset) {
	 *   console.log(changeset.changed); // { 'foo': 'bar' }
	 * });
	 * synced.data.foo = 'bar';
	 * @class SyncedObject
	 * @mixes external:EventEmitter
	 */
	var SyncedObject = function () {

		EventEmitter.call(this);
		this._data = {};
		this.onAttributesChange = this.onAttributesChange.bind(this);
	};

	util.inherits(SyncedObject, EventEmitter);

	/**
	 * The wrapped data object. Changes to it's top level attributes are
	 * detected and a {@link SyncedObject#event:changed changed} event is
	 * fired in this case.
	 * @type {Object}
	 * @name data
	 * @instance
	 * @memberOf SyncedObject
	 */
	Object.defineProperty(SyncedObject.prototype, 'data', {
		get: function() {
			return this._data;
		},
		set: function(val) {
			if (typeof val === 'object') {
				// remove
				for (var j in this._data) {
					if (!val.propertyIsEnumerable(j)) {
						delete this._data[j];
					}
				}
				// add
				for (var i in val) {
					this._data[i] = val[i];
				}
			}
		}
	});

	/**
	 * Starts detecting changes to the wrapped object.
	 * @memberOf SyncedObject
	 */
	SyncedObject.prototype.startWatching = function () {
		WatchJS.watch(this._data, this.onAttributesChange, 0, true);
	};

	/**
	 * Stops detecting changes to the wrapped object. You can resume watching
	 * @memberOf SyncedObject
	 * again any time.
	 */
	SyncedObject.prototype.stopWatching = function () {
		WatchJS.unwatch(this._data, this.onAttributesChange);
	};

	/**
	 * Applies the given changeset to the wrapped object without fireing 
	 * a {@link SyncedObject#event:changed changed} event.
	 * @param  {SyncedObject.Changeset} changeset  changes that should be
	 *  applied to the wrapped object
	 * @memberOf SyncedObject
	 */
	SyncedObject.prototype.applyChangesetSilently = function (changeset) {
		this.stopWatching();
		this.applyChangeset(changeset);
		this.startWatching();
	};

	/**
	 * Applies the given changeset to the wrapped object. Note that this
	 * method fires a {@link SyncedObject#event:changed changed} event if any 
	 * attribute does change. If you don't want to receive this event, use 
	 * {@link SyncedObject#applyChangesetSilently applyChangesetSilently} 
	 * instead.
	 * @fires  SyncedObject#changed
	 * @param  {SyncedObject.Changeset} changeset  changes that should be
	 *  applied to the wrapped object
	 * @memberOf SyncedObject
	 */
	SyncedObject.prototype.applyChangeset = function (changeset) {
		var propertyName;
		if (changeset.hasOwnProperty('changed')) {
			for (propertyName in changeset.changed) {
				this._data[propertyName] = changeset.changed[propertyName];
			}
		}
		if (changeset.hasOwnProperty('removed')) {
			for (var i in changeset.removed) {
				propertyName = changeset.removed[i];
				delete this._data[propertyName];
			}
		}
	};

	/** 
	 * @param {string} property  property that has been changed
	 * @param {string} action    what has been done to the property
	 * @param          newValue  new value of the changed property
	 * @param          oldValue  old value of the changed property
	 * @see                      https://github.com/melanke/Watch.JS
	 * @private
	 */
	SyncedObject.prototype.onAttributesChange = function (property, action, newValue, oldValue) {
		var changed = {};
		var removed = [];

		if (property === 'root' && action === 'differentattr') {
			// some attributes have been added or deleted
			for (var i in newValue.added) {
				var propertyName = newValue.added[i];
				changed[propertyName] = this._data[propertyName];
			}
			for (var j in newValue.removed) {
				removed.push(newValue.removed[j]);
			}
		} else if (action === 'set' &&
				JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
			// one attribute has changed
			changed[property] = newValue;
		}

		var changeset = {};
		if (Object.keys(changed).length > 0) {
			changeset.changed = changed;
		}
		if (Object.keys(removed).length > 0) {
			changeset.removed = removed;
		}

		this.emit('changed', changeset);
	};

	/**
	 * Get the value of a specific attribute from the synced object. If the value
	 * is not present yet, it will be passed to the returned promise later on.
	 * This should make handling async code a bit easier.
	 * @param  {string} name       name of the attribute whose value you want to 
	 *  know
	 * @param  {integer} [timeout=3000] time in milliseconds after which the returned
	 *  promise will be rejected, if the attribute is not present
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the value of the requested attribute. Has the attribute not been available 
	 * after the given timout, the promise will be rejected with a generic
	 * error.
	 * @memberOf SyncedObject
	 *
	 * @example
	 * var sync = new SyncedObject();
	 * sync.startWatching();
	 * sync.get('foo').then(function (value) {
	 *   console.log(value); // will be 'bar'
	 * });
	 * sync.get('na').fail(function (error) {
	 *   // when 'na' has never been set
	 *   console.log(error);
	 * });
	 * sync.data.foo = 'bar';
	 * 
	 */
	SyncedObject.prototype.get = function (name, timeout) {
		var deferred = Q.defer();
		var syncedObject = this;

		if (this._data.hasOwnProperty(name)) {
			deferred.resolve(this._data[name]);
		} else {
			var onChanged = function (changeset) {
				if (syncedObject._data.hasOwnProperty(name)) {
					syncedObject.removeListener('changed', onChanged);
					deferred.resolve(syncedObject._data[name]);
				}
			};
			this.on('changed', onChanged);
		}

		return deferred.promise.timeout(timeout || 3000);
	};

	/**
	 * Fired when any top level attribute of the wrapped object has changed.
	 * @event SyncedObject#changed
	 * @property {SyncedObject.Changeset} changeset  what has changed exactly?
	 */

	exports = SyncedObject;
	return exports;

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



define('../shared/CustomMessageSender',['require','exports','module'],function(require, exports, module) {
	'use strict';

	/**
	 * @classdesc Util class for all objects that allow to send custom messages
	 *  (e.g. player.message('foo', {data: 'bar'})).
	 * @param {module:server/messages~MessageBus|module:client/messages~MessageBus} 
	 *  messageBus message bus instance used for sending the messages
	 * @param {string} instance   instance identifier that should be used for
	 *  the 'fromInstance' attribute of outgoing messages
	 * @private
	 */
	var CustomMessageSender = function (messageBus, instance) {
		this.messageBus = messageBus;
		this.instance = instance;
	};

	/**
	 * Sends a custom message over the message bus.
	 * @param  {string} type     name of the custom message
	 * @param  {*}      [data]   any data to transport
	 * @param  {module:client/multi~toClient|module:server/multi~toClient} 
	 *  [toClient='all'] which client should receive the message
	 * @param  {boolean} [volatile=false] if true, the message may be dropped
	 *  by the framework
	 */
	CustomMessageSender.prototype.message = function (type, data, toClient, volatile) {
		var message = {
			name: 'message',
			fromInstance: this.instance,
			type: type,
			data: data
		};

		message.toClient = toClient || 'all';
		if (typeof message.toClient === 'object') {
			if (message.toClient instanceof Array) {
				for (var i in message.toClient) {
					message.toClient[i] = message.toClient[i].id;
				}
			} else {
				message.toClient = [ message.toClient.id ];
			}
		}

		if (volatile === true) {
			message.volatile = true;
		}

		this.messageBus.send(message);
	};

	
	exports = CustomMessageSender;
	return exports;

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



/**
 * @module shared/player
 * @private
 */
define('../shared/player',['require','exports','module','./SyncedObject','./CustomMessageSender','events','util'],function(require, exports, module) {
	'use strict';

	var SyncedObject = require('./SyncedObject');
	var MessageSender = require('./CustomMessageSender');
	var EventEmitter = require('events').EventEmitter;
	var util = require('util');

	/**
	 * @classdesc This player class represents a device connected
	 * to a session. Every player will be mirrored to the server and
	 * all connected devices. This class can be used the same way on
	 * server and client side.
	 *
	 * @mixes external:EventEmitter
	 * @fires module:shared/player~Player#attributesChanged
	 * @fires module:shared/player~Player#disconnected
	 * @memberof module:shared/player
	 * @class
	 * @inner
	 * @protected
	 *
	 * @param {string} id  unique identifier of this player
	 * @param {module:client/messages~MessageBus|module:server/messages~MessageBus} 
	 *  messageBus  message bus instance this player should use to communicate
	 */
	var Player = function (id, messageBus) {

		EventEmitter.call(this);

		// PUBLIC

		/** 
		 * unique id for this player
		 * @type {string}
		 * @readonly
		 */
		this.id = id;
		/**
		 * Unique player-number inside this session beginning with 0.
		 * Free numbers from disconnected players will be reused to
		 * avoid gaps.
		 * @type {integer}
		 * @readonly
		 */
		this.number = null;
		/**
		 * pixel width of this clients screen
		 * @type {integer}
		 * @readonly
		 */
		this.width = null;
		/**
		 * pixel height of this clients screen
		 * @type {integer}
		 * @readonly
		 */
		this.height = null;


		// PROTECTED

		this.messageBus = messageBus;
		this.messageSender = new MessageSender(messageBus, id);
		/**
		 * wrapper for this players attributes
		 * @type {SyncedObject}
		 * @private
		 */
		this.syncedAttributes = new SyncedObject();


		// LISTENERS
	
		this.messageToken = this.messageBus.register('message',
			this.id, this.onMessage.bind(this));

		this.attributesChangedToken = this.messageBus.register('attributesChanged',
			this.id, this.onAttributesChangedRemotely.bind(this));

		this.disconnectToken = this.messageBus.register('disconnect',
			this.id, this.onDisconnect.bind(this));

		this.userDisconnectToken = this.messageBus.register('user-disconnect',
			this.id, this.onUserDisconnect.bind(this));

		this.syncedAttributes.on('changed', this.onAttributesChangedLocally.bind(this));
		this.syncedAttributes.startWatching();
	};

	util.inherits(Player, EventEmitter);

	/** 
	 * Object with user attributes for this player.
	 * All changes within this object will automatically
	 * be synced to all other clients.<br>
	 * Listen for changes by subscribing to the
	 * {@link module:shared/player~Player#event:attributesChanged attributesChanged}
	 * event.
	 * @type {object}
	 * @name attributes
	 * @memberOf module:shared/player~Player
	 * @instance
	 */
	Object.defineProperty(Player.prototype, 'attributes', {
		get: function() {
			return this.syncedAttributes.data;
		},
		set: function(val) {
			this.syncedAttributes.data = val;
		}
	});

	/** 
	 * Called when the user attributes have been changed locally.
	 * @param {SyncedObject.Changeset} changeset
	 * @private
	 */
	Player.prototype.onAttributesChangedLocally = function (changeset) {
		this.messageBus.send({
			name: 'attributesChanged',
			fromInstance: this.id,
			changeset: changeset
		});
	};

	/**
	 * Some players attributes were changed remotely. 
	 * Apply the changes.
	 * @abstract
	 * @private
	 */
	Player.prototype.onAttributesChangedRemotely = function (message) { };

	/**
	 * Called when this socket receives a message for any player.
	 * @private
	 */
	Player.prototype.onMessage = function (message) {
		this.emit(message.type, { type: message.type, data: message.data } );
	};

	/**
	 * Handles disconnection by removing listeners, stopping attribute
	 * syncing and emitting a disconnected event.
	 * @private
	 */
	Player.prototype.onDisconnect = function () {
		// I do not longer exist - inform...
		this.emit('disconnected');
		// ... and remove listeners
		this.removeAllListeners();
		this.messageBus.unregister(this.messageToken);
		this.messageBus.unregister(this.attributesChangedToken);
		this.messageBus.unregister(this.userDisconnectToken);
		this.messageBus.unregister(this.disconnectToken);
		this.syncedAttributes.removeAllListeners();
		this.syncedAttributes.stopWatching();
	};

	/**
	 * Gets called when this player has been disconnected by the user
	 * on any client or the server.
	 * @private
	 * @abstract
	 */
	Player.prototype.onUserDisconnect = function (message) {};

	/**
	 * Notifies the user about every change inside the given changeset.
	 * @param  {SyncedObject.Changeset} changeset
	 * @private
	 */
	Player.prototype.emitAttributeChanges = function (changeset) {
		if (changeset.hasOwnProperty('changed')) {
			for (var i in changeset.changed) {
				this.emit('attributeChanged/' + i, this.attributes[i]);
			}
		}
	};

	/**
	 * Get the value of a specific 
	 * {@link module:shared/player~Player#attributes attributes}
	 * field. If the value is not present yet, it will be passed to the returned 
	 * promise later on. This should make handling async code a bit easier.<br>
	 * This method is especially useful for attributes that are set just once
	 * right after the player joined a session but need a bit of time to sync to 
	 * all clients, eg. player color, name, etc.
	 * @param  {string} name       name of the attribute whose value you want to 
	 *  know
	 * @param  {integer} [timeout=1000] time in milliseconds after which the 
	 *  returned promise will be rejected, if the attribute is not present
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the value of the requested attribute. Has the attribute not been available 
	 * after the given timout, the promise will be rejected with a generic
	 * error.
	 *
	 * @example
	 * session.on('playerJoined', function (event) {
	 *   event.player.getAttributeAsync('foo').then(function (value) {
	 *     console.log(value); // will be '#ff0000'
	 *   });
	 * });
	 * 
	 * // on another client:
	 * player.attributes.color = '#ff0000';
	 * 
	 */
	Player.prototype.getAttributeAsync = function (name, timeout) {
		return this.syncedAttributes.get(name, timeout);
	};

	/**
	 * Sends the given message to all client instances of this player.
	 * @example
	 * // on any client
	 * player.on('ping', function (event) {
	 *   // outputs 'bar'
	 *   console.log(event.data.foo);
	 * });
	 * // on server, instance of same player
	 * player.message('ping', { foo: 'bar' });
	 * @param {string} type    type of message that should be send
	 * @param {object} [data]  message data that should be send
	 * @param {module:server/multi~toClient|module:client/multi~toClient} 
	 *  [toClient='all']  which client should receive this message
	 * @param {boolean} [volatile=false]  if true, the message may be dropped
	 *  by the framework. Use this option for real time data where one dropped
	 *  message does not interrupt your application.
	 */
	Player.prototype.message = function (type, data, toClient, volatile) {
		this.messageSender.message(type, data, toClient, volatile);
	};

	/**
	 * Disconnect the client represented by this player from the framework.
	 * Due to security reasons this will only work with the player that
	 * represents this client (session.myself) and fail silently on all others.
	 * @fires module:shared/player~Player#disconnected
	 */
	Player.prototype.disconnect = function () {
		this.messageBus.send({
			name: 'user-disconnect',
			fromInstance: this.id
		});
	};

	/**
	 * Determines if this player is the first one inside its session (has player
	 * number 0). Use this method to find out if this player has opened the 
	 * session or has joined later on.
	 * @return {boolean} true if the player number is 0, false otherwise
	 */
	Player.prototype.isFirst = function () {
		return this.number === 0;
	};

	/**
	 * Prepares this player for sending it via socket message
	 * while avoiding circular dependencies.
	 * @return {object} serialized player object (without socket)
	 */
	Player.prototype.serialize = function () {
		return {
			id: this.id,
			number: this.number,
			attributes: this.attributes,
			width: this.width,
			height: this.height
		};
	};
	
	/**
	 * Fired when the {@link module:shared/player~Player#attributes attributes} 
	 * of this player have been changed by any client or the server.
	 * @event module:shared/player~Player#attributesChanged
	 * @property {*}      value  new value of the changed attribute
	 *
	 * @example
	 * player.on('attributeChanged/score', function (score) {
	 *   console.log(score);
	 * });
	 *
	 * // on another client or server
	 * player.attributes.score++;
	 */

	/**
	 * Fired when this player disconnects from the server. Don't use this
	 * instance any longer after this event has been fired.
	 * @event module:shared/player~Player#disconnected
	 */


	/**
	 * Compare function to sort an array of players by 
	 * {@link module:shared/player~Player#number player numbers}.
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	 */
	exports.compare = function (p1, p2) {
		return p1.number - p2.number;
	};

	exports.Player = Player;
	return exports;

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



/**
 * @module shared/session
 * @private
 */
define('../shared/session',['require','exports','module','events','util','./player'],function(require, exports, module) {
	'use strict';

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var playerModule = require('./player');


	/**
	 * @typedef {Object} SessionOptions
	 * @property {string} [scriptName] name of server side script file that should
	 *  be executed when a new session is created. This module must export a 
	 *  constructor that takes a session as its only argument (module.exports = 
	 *  function (session)). This property has to contain only numbers (0-9) and 
	 *  letters (A-Za-z) for security reasons. Multi will look for the given module
	 *  name inside a 'games' directory that lies next to the multi directory.
	 * @property {string} [token.func='numeric']  name of a function inside the 
	 *  {@link module:server/token} module that should generate the session token
	 * @property {Array}  [token.args=[]]   argument array for the token 
	 *  generationfunction
	 * @property {integer}[minPlayerNeeded=1] minimum number of players needed 
	 *  for this session
	 * @property {integer}[maxPlayerAllowed=10] maximum number of players allowed 
	 *  for this session. Every addition player won't be allowed to join the session.
	 * @property {Array.<string>}[filter] list of names of filter functions. 
	 *  The functions have to be defined in {@link module:server/filter} and will 
	 *  then be used to filter outgoing server-messages.
	 */


	/**
	 * @classdesc A game session that connects and manages multiple players.
	 *
	 * @mixes external:EventEmitter
	 * @memberof module:shared/session
	 * @class
	 * @inner
	 * @protected
	 *
	 * @see module:client/session~Session
	 * @see module:server/session~Session
	 *
	 * @fires module:shared/session~Session#playerJoined
	 * @fires module:shared/session~Session#playerLeft
	 * @fires module:shared/session~Session#destroyed
	 * @fires module:shared/session~Session#belowMinPlayerNeeded
	 * @fires module:shared/session~Session#aboveMinPlayerNeeded
	 */
	var Session = function (messageBus) {

		EventEmitter.call(this);

		// PUBLIC
		/** 
		 * unique token identifying this session
		 * @type {string}
		 * @readonly
		 */
		this.token = null;
		/**
		 * Dictionary of all players currently connected
		 * to this session mapped on their ids.
		 * @type {Object.<string, module:shared/player~Player>}
		 * @readonly
		 */
		this.players = {};
		/**
		 * @see SessionOptions
		 * @readonly
		 */
		this.minPlayerNeeded = 1;
		/**
		 * @see SessionOptions
		 * @readonly
		 */
		this.maxPlayerAllowed = 10;
		/**
		 * if false no more clients are allowed to join this session
		 * @private
		 */
		this.playerJoiningEnabled = true;


		// PROTECTED
		this.messageBus = null;
		this.messageSender = null;
	};

	util.inherits(Session, EventEmitter);

	/**
	 * Child classes should call this method when they are finished building 
	 * and are ready to add listeners to themselves.
	 * @protected
	 */
	Session.prototype.onSessionReady = function () {
		var session = this;

		this.messageBus.register('message', 'session', function (message) {
			session.emit(message.type,  { type: message.type, data: message.data });
		});

		this.messageBus.register('changePlayerJoining', 'session', function (message) {
			session.playerJoiningEnabled = message.playerJoiningEnabled;
		});
	};

	/**
	 * Deconstructs this session when no longer needed and informs listening
	 * objects.
	 * @protected
	 */
	Session.prototype.destroy = function () {
		this.emit('destroyed');
		this.messageBus.unregisterAll();
		this.removeAllListeners();
	};

	/**
	 * Adds the given player to this session. Override if needed.
	 * @param player {module:shared/player~Player} player instance to add
	 * @fires module:shared/session~Session#playerJoined
	 * @protected
	 */
	Session.prototype.addPlayer = function (player) {
		var session = this;

		// add to collection
		this.players[player.id] = player;

		// add listeners
		player.on('disconnected', function () {
			session.removePlayer(player);
		});

		// inform others about this player
		session.emit('playerJoined', { player: player });
		if (session.getPlayerCount() === session.minPlayerNeeded) {
			session.emit('aboveMinPlayerNeeded');
		}
		if (session.getPlayerCount() === session.maxPlayerAllowed) {
			session.emit('aboveMaxPlayerNeeded');
		}
	};

	/**
	 * Removes the given player from this session. Override if needed.
	 * @param player {module:shared/player~Player} player instance to remove
	 * @fires module:shared/session~Session#playerRemoved
	 * @protected
	 */
	Session.prototype.removePlayer = function (player) {
		delete this.players[player.id];
		this.emit('playerLeft', { player: player });

		if (this.getPlayerCount() === (this.minPlayerNeeded-1)) {
			this.emit('belowMinPlayerNeeded');
		}
		if (this.getPlayerCount() === (this.maxPlayerNeeded-1)) {
			this.emit('belowMaxPlayerNeeded');
		}
	};

	/**
	 * @returns {Array.<module:shared/player~Player>} an array of all 
	 * players currently connected to this session.
	 * The array is sorted by 
	 * {@link module:shared/player~Player#number player numbers} 
	 * from small to high.
	 */
	Session.prototype.getPlayerArray = function () {
		var playerArray = [];
		for(var i in this.players) {
			playerArray.push(this.players[i]);
		}
		return playerArray.sort(playerModule.compare);
	};

	/**
	 * @return {integer} number of currently connected players including myself
	 */
	Session.prototype.getPlayerCount = function () {
		return Object.keys(this.players).length;
	};

	/**
	 * @returns {module:shared/player~Player} the player with the
	 * given {@link module:shared/player~Player#number player numbers} 
	 * (even if this is myself) or null if no player with this number 
	 * exists
	 */
	Session.prototype.getPlayerByNumber = function (number) {
		var players = this.getPlayerArray().filter(function (player) {
			return player.number === number;
		});
		return players[0] || null;
	};

	/**
	 * @returns {module:shared/player~Player} the player with the
	 * given {@link module:shared/player~Player#id id} 
	 * (even if this is myself) or null if no player with this id 
	 * exists
	 */
	Session.prototype.getPlayerById = function (id) {
		return this.players[id] || null;
	};

	/**
	 * @return {boolean} true if there are as many ore more players 
	 * connected to this session as are allowed
	 */
	Session.prototype.isFull = function () {
		return this.getPlayerCount() >= this.maxPlayerAllowed;
	};

	/**
	 * When you call this new players are not allowed to join this
	 * session any more. Instead their promise will be rejected with a 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}.
	 */
	Session.prototype.disablePlayerJoining = function () {
		this.playerJoiningEnabled = false;
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			playerJoiningEnabled: false
		});
	};

	/**
	 * A call to this method will allow new players to join this session
	 * again.
	 */
	Session.prototype.enablePlayerJoining = function () {
		this.playerJoiningEnabled = true;
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			playerJoiningEnabled: true
		});
	};

	/**
	 * Sends the given message to all other instances of this session.
	 * @param {string} type    type of message that should be send
	 * @param {object} [data]  message data that should be send
	 * @param {module:client/multi~toClient|module:server/multi~toClient} 
	 *  [toClient='all']  which client should receive this message
	 * @param {boolean} [volatile=false]  if true, the message may be dropped
	 *  by the framework. Use this option for real time data where one dropped
	 *  message does not interrupt your application.
	 * @example
	 * // on client no 1 or server
	 * session.on('ping', function (event) {
	 *   // outputs 'bar'
	 *   console.log(event.data.foo);
	 * });
	 * // on client no 2 or server, instance of same session
	 * session.message('ping', { foo: 'bar' });
	 */
	Session.prototype.message = function (type, data, toClient, volatile) {
		this.messageSender.message(type, data, toClient, volatile);
	};

	/**
	 * Prepares this session and all its players for sending 
	 * it via socket message while avoiding circular dependencies.
	 * @return {object} serialized session object including players
	 */
	Session.prototype.serialize = function() {
		var players = [];
		for (var i in this.players) {
			players.push(this.players[i].serialize());
		}
		return {
			token: this.token,
			players: players,
			minPlayerNeeded: this.minPlayerNeeded,
			maxPlayerAllowed: this.maxPlayerAllowed
		};
	};

	/**
	 * Fired when this session is no longer valid. <br>
	 * The reason could be a broken connection or the
	 * removal of your own player. <br><br>
	 * Don't use this session any longer after the event 
	 * has been fired.
	 * @event module:shared/session~Session#destroyed
	 */

	/**
	 * Fired when a new player has been added to this session.
	 * From now on you can safely communicate with this player.
	 * @event module:shared/session~Session#playerJoined
	 * @property {module:shared/player~Player} player  The newly added player.
	 * @example <caption>Adding connected players to the DOM</caption>
	 * session.on('playerJoined', function (event) {
	 *   var playerDiv = $('#player').clone();
	 *   $('#players').append(playerDiv);
	 *   event.player.on('disconnected', function () {
	 *     playerDiv.remove();
	 *   });
	 * }
	 */

	/**
	 * Fired when a player has been removed from this session.
	 * @event module:shared/session~Session#playerLeft
	 * @property {module:shared/player~Player} player  The removed player.
	 */

	/**
	 * Fired when a player has been removed from this session and
	 * there are now less player connected to this session than stated 
	 * in minPlayerNeeded.<br><br>
	 * You could listen for this event to stop a running game when
	 * the player count is getting to low.
	 * @event module:shared/session~Session#belowMinPlayerNeeded
	 */

	/**
	 * Fired when a new player has been added to this session and
	 * there are now exactly as many players connected to this session
	 * as stated in minPlayerNeeded.<br><br>
	 * You could listen for this event to start your game when
	 * enough players have connected.
	 * @event module:shared/session~Session#aboveMinPlayerNeeded
	 */

	/**
	 * Fired when a new player has been added to this session and
	 * there are now exactly as many players connected to this session
	 * as stated in maxPlayerAllowed.
	 * @event module:shared/session~Session#aboveMaxPlayerAllowed
	 */

	/**
	 * Fired when a player has been removed from this session and
	 * there are now less player connected to this session than stated 
	 * in maxPlayerNeeded.
	 * @event module:shared/session~Session#belowMaxPlayerAllowed
	 */


	exports.Session = Session;
	return exports;

});
/**
 * @module client/player
 * @private
 */
 
define('player',['require','exports','module','../shared/player','util'],function(require, exports, module) {
	'use strict';

	var AbstractPlayer = require('../shared/player').Player;
	var util = require('util');

	/**
	 * @classdesc Client side representation of a player object.
	 * @mixes module:shared/player~Player
	 * @inner
	 * @class
	 * @private
	 * @memberof module:client/player
	 * @param {string} id  unique identifier of this player
	 * @param {module:client/messages~MessageBus} messageBus  message bus 
	 *  instance this player should use to communicate
	*/
	var Player = function (id, messageBus) {

		AbstractPlayer.call(this, id, messageBus);

	};

	util.inherits(Player, AbstractPlayer);


	/* override */

	Player.prototype.onAttributesChangedRemotely = function (message) {
		this.syncedAttributes.applyChangesetSilently(message.changeset);
		this.emitAttributeChanges(message.changeset);
	};


	/* exports */

	/**
	* Deserializes a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.deserialize = function (data, messageBus) {
		var player = new Player(data.id, messageBus);
		for (var i in data) {
			player[i] = data[i];
		}
		return player;
	};

	return exports;

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



define('../shared/PubSub',['require','exports','module'],function(require, exports, module) {
	'use strict';

	/**
	 * @classdesc A simple implementation of the content based
	 * Publish/Suscribe-Pattern as described at
	 * {@link http://msdn.microsoft.com/en-us/library/ff649664.aspx}.
	 * @class PubSub
	 * @private
	 * @example
	 * var pubSub = new PubSub();
	 *
	 * var myCallback = function (message) {
	 *   // this will be called, for any message that
	 *   // is approved by our filter function
	 *   console.log(message);
	 * };
	 * 
	 * pubSub.subscribe(myCallback, function (message) {
	 *   // filter function returning true or false
	 *   return message.topic === 'test' && message.sender === 42;
	 * });
	 *
	 * pubSub.publish({ topic: 'test', sender: 42 }); // myCallback is called
	 * pubSub.publish({ topic: 'test', sender: 0 });  // myCallback is not called
	 */
	var PubSub = function () {
		this.listeners = [];
	};

	/**
	 * Adds a callback funtion that is called for any message published
	 * to this pubSub-instance that is approved by the given filter function.
	 * @param  {function} callback  this will be called for any published message
	 *  that matches the filter function. The massage will be passed as argument.
	 * @param  {function} filter    a filter function acception any message as
	 *  argument and returning true, when the message should be accepted and
	 *  false otherwise.
	 * @return  a token that can be used to unsubscribe this callback-filter-combo
	 * @memberOf PubSub
	 */
	PubSub.prototype.subscribe = function (callback, filter) {
		if (typeof callback !== 'function' || typeof filter !== 'function') {
			throw 'callback and filter have to be a function';
		}
		var token = function (message) {
			if (filter(message)) {
				callback(message);
			}
		};
		this.listeners.push(token);
		return token;
	};

	/**
	 * Removes a callback-filter-combo so they don't receive published messages
	 * any longer.
	 * @param  token  the token to identify the subscription that should
	 *  be removed - returned by the subscribe method	
	 * @memberOf PubSub
	 * @example
	 * var pubSub = new PubSub();
	 *
	 * // subscribe
	 * var token = pubSub.subscribe(myCallback, function (message) {
	 *   return message.receiver === 'xyz';
	 * });
	 * 
	 * // unsubscribe
	 * pubSub.unsubscribe(token);
	 */
	PubSub.prototype.unsubscribe = function (token) {
		var index = this.listeners.indexOf(token);
		if (index !== -1) {
			this.listeners.splice(index, 1);
		}
	};

	/**
	 * Publishes a message in any format to all interested
	 * subscribers.
	 * @param  {*} message
	 * @memberOf PubSub
	 */
	PubSub.prototype.publish = function (message) {
		var listeners = this.listeners;
		for (var i in listeners) {
			listeners[i](message);
		}
	};

	/**
	 * Removes all subscriptions on this instance.
	 * @memberOf PubSub
	 */
	PubSub.prototype.unsubscribeAll = function () {
		this.listeners = [];
	};

	exports = PubSub;
	return exports;

});
/**
 * @module client/messages
 * @private
 */
 
define('messages',['require','exports','module','../shared/PubSub'],function(require, exports, module) {
	'use strict';

	var PubSub = require('../shared/PubSub');

	/**
	 * @classdesc Centralized communication infrastructure for one session.
	 * Every session or player can send messages to the outside world
	 * and subscribe to messages, using a custom filter.
	 * @class
	 * @param socket socket.io socket instance that connects the
	 *  using session to the outside world
	 * @private
	 */
	exports.MessageBus = function (socket) {
		var messageBus = this;

		this.socket = socket;
		this.pubSub = new PubSub();

		socket.on('disconnect', function () {
			messageBus.onSocketMessage({
				name: 'disconnect',
				fromInstance: 'session'
			});
		});
		socket.on('multi', function (data) {
			messageBus.onSocketMessage(data);
		});
	};

	/**
	 * The socket send a message - publish it to all subscribers.
	 * @private
	 */
	exports.MessageBus.prototype.onSocketMessage = function (message) {
		// console.log(JSON.stringify(message));
		this.pubSub.publish(message);
	};

	/**
	 * Sends the given message to the server and the instances of the sender
	 * (fromInstance) on all other clients (including the sending client) by 
	 * default. <br><br>
	 * You can set message.toClient to: <br>
	 * <ul>
	 * <li>'all' - default behaviour </li>
	 * <li>'all-but-myself' - message does not return to sending client (broadcast) </li>
	 * <li>['id1', 'id2'] - message will be send to all clients whose IDs are 
	 * inside the array </li>
	 * </ul>
	 * Use this option to save bandwidth.<br><br>
	 * Message that have set message.volatile=true may be dropped by the framework.
	 * 
	 * @param  {object} message
	 * @example
	 * messageBus.send({
	 *   name: 'myEvent',
	 *   fromInstance: 'playerXYZ',
	 *   toClient: 'all-but-myself',
	 *   data1: 'mydata',
	 *   data2: 42
	 * });
	 */
	exports.MessageBus.prototype.send = function (message) {
		this.socket.emit('multi', message);
	};

	/**
	 * Register a callback for messages from the outside world.
	 * @param  {string}   messageName  on which message name you would like to register?
	 * @param  {string}   instance     messages from which instance do interest you?
	 * @param  {Function} callback     function to call when a corresponding message
	 *  is received (message name _and_ instance correspond to arguments)
	 * @return {}                      token to unregister this callback again
	 */
	exports.MessageBus.prototype.register = function (messageName, instance, callback) {
		return this.pubSub.subscribe(callback, function (message) {
			return instance === message.fromInstance && messageName === message.name;
		});
	};

	/**
	 * Unrigister a callback you registered earlier.
	 * @param  {} token  register token returned by 'register' method
	 * @example
	 * // register
	 * token = messageBus.register('myEventName', myId, callback);
	 * // ... do something ...
	 * // unregister again
	 * messageBus.unregister(token);
	 */
	exports.MessageBus.prototype.unregister = function (token) {
		this.pubSub.unsubscribe(token);
	};

	/**
	 * Unregister all callbacks from this MessageBus instance.
	 */
	exports.MessageBus.prototype.unregisterAll = function () {
		this.pubSub.unsubscribeAll();
	};

	return exports;

});
/**
 * @module client/session
 * @private
 */

define('session',['require','exports','module','../shared/session','util','./player','./messages','../shared/CustomMessageSender'],function(require, exports, module) {
	'use strict';

	var AbstractSession = require('../shared/session').Session;
	var util = require('util');
	var playerModule = require('./player');
	var MessageBus = require('./messages').MessageBus;
	var MessageSender = require('../shared/CustomMessageSender');


	/**
	* @classdesc A game session that connects and manages multiple players on 
	* the client side.
	* @inner
	* @class
	* @protected
	* @mixes module:shared/session~Session
	* @memberof module:client/session
	*
	* @param {module:client/player~Player} myself  the player instance that 
	* represents my own client.
	* @param {} messageBus
	* @param {object} sessionData  data object from the server that
	* describes this session
	*/
	var Session = function (myself, messageBus, sessionData) {

		AbstractSession.call(this);

		/**
		 * The player instance that represents my own client.
		 * @type {module:client/player~Player}
		 * @readonly
		 */
		this.myself = myself;
		this.players[myself.id] = myself;

		this.messageBus = messageBus;
		this.messageSender = new MessageSender(this.messageBus, 'session');

		this.applySessionData(sessionData);

		/**
		 * URL you have to visit in order to connect to this session.
		 * @type {string}
		 * @readonly
		 */
		this.joinSessionUrl = getJoinSesionUrl(this.token);

		// add messages listeners
		this.onSessionReady();
		this.messageBus.register('disconnect', 'session', this.destroy.bind(this));
		this.messageBus.register('playerJoined', 'session', this.onPlayerJoined.bind(this));
		window.addEventListener('unload', function () {
			myself.disconnect();
		});
	};

	util.inherits(Session, AbstractSession);


	/* private */

	/**
	 * Deserializes the given sessionData onto this session.
	 * @private
	 */
	Session.prototype.applySessionData = function (sessionData) {
		var seializedPlayers = sessionData.players;
		delete sessionData.players;

		// deserialize session attributes
		for (var i in sessionData) {
			this[i] = sessionData[i];
		}
		// deserialize players
		for (i in seializedPlayers) {
			this.onPlayerJoined({ playerData: seializedPlayers[i] });
		}
	};

	/**
	 * Creates a player from the given data and adds it to this session.
	 * @private
	 */
	Session.prototype.onPlayerJoined = function (message) {
		var player = playerModule.deserialize(message.playerData, this.messageBus);
		this.addPlayer(player);
	};



	/* module functions */

	function getJoinSesionUrl(token) {
		var url = window.location.host;
		if (window.location.port !== '' && window.location.port !== '80') {
			url += ':' + window.location.port;
		}
		url += window.location.pathname + '#' + token;
		return url;
	}

	/**
	* Deserializes a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.deserialize = function (data, socket) {
		var messageBus = new MessageBus(socket);
		var myself = playerModule.deserialize(data.player, messageBus);
		var session = new Session(myself, messageBus, data.session);
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
 * This is not multis core functionality but might be convenient to use.
 * @module
 */
define('../shared/color',['require','exports','module'],function(require, exports, module) {
	'use strict';

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
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



/**
 * Collection of Error classes that multi uses to communicate that
 * something went wrong.
 * @private
 * @module shared/errors
 */
define('../shared/errors',['require','exports','module','util'],function(require, exports, module) {
	'use strict';

	var util = require('util');

	/**
	 * The built in error object.
	 * @external Error
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
	 */

	/**
	 * @classdesc Generic framewok error.
	 * @class
	 * @memberof module:shared/errors
	 * @mixes external:Error
	 */
	var MultiError = exports.MultiError = function () {
		var err = Error.apply(this, arguments);
		this.stack = err.stack;
		this.message = err.message;
	};
	util.inherits(MultiError, Error);

	/**
	 * @classdesc The session you were looking for was not found
	 * on the server. Most likely the token has been misspelled.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.NoSuchSessionError = function () {
		MultiError.call(this, 'the requested session does not exist');
	};
	util.inherits(exports.NoSuchSessionError, MultiError);


	/**
	 * @classdesc The session you wanted to create already exists.
	 * This can happen when you have configured a static session 
	 * token inside the {@link SessionOptions} and are trying to 
	 * create this session more than once. Closing any open tabs
	 * connected to this session may solve your problem.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.TokenAlreadyExistsError = function () {
		MultiError.call(this, 'a session with this token does already exist');
	};
	util.inherits(exports.TokenAlreadyExistsError, MultiError);


	/**
	 * @classdesc The session you wanted to join already has enough
	 * players. This happens when there are as many or more players 
	 * connected as defined in 
	 * {@link module:client/session~Session#maxPlayerAllowed maxPlayerAllowed}.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.SessionFullError = function () {
		MultiError.call('the requested session is full');
	};
	util.inherits(exports.SessionFullError, MultiError);


	/**
	 * @classdesc You are not able to create or join a session
	 * because there is no connection to the server. Maybe the
	 * socket.io settings are wrong or the internet connection
	 * dropped.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.NoConnectionError = function () {
		MultiError.call(this, 'no connection to server');
	};
	util.inherits(exports.NoConnectionError, MultiError);


	/**
	 * @classdesc There could be no valid session token extracted
	 * from the url. You may want to check if the current url has
	 * the format http://myGameUrl/some/game#myToken
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.NoSessionTokenFoundError = function () {
		MultiError.call(this, 'no session token found in url');
	};
	util.inherits(exports.NoSessionTokenFoundError, MultiError);


	/**
	 * @classdesc New players are currently not allowed to join
	 * this session. Maybe someone called 
	 * {@link module:client/session~Session#disablePlayerJoining}.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.JoiningDisabledError = function () {
		MultiError.call(this, 'player joining is currently disabled');
	};
	util.inherits(exports.JoiningDisabledError, MultiError);


	/**
	 * @classdesc The script name you configured in the {@link SessionOptions}
	 *  is not valid.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.ScriptNameNotAllowedError = function () {
		MultiError.call(this, 'only letters (A-Za-z) and digits (0-9) are allowed for sessionOptions.scriptName');
	};
	util.inherits(exports.ScriptNameNotAllowedError, MultiError);


	return exports;

});
/**
* Util functions and classes to make working with session tokens a bit
* easier.
* @module client/token
*/

define('token',['require','exports','module','../lib/q','../shared/errors'],function(require, exports, module) {
	'use strict';

	var Q = require('../lib/q');
	var errors = require('../shared/errors');

	/**
	 * Extracts the session token from the current URL. At the moment it has to 
	 * follow the format "http://path.to/my/server#myToken".
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the parsed session token. On error it will be rejected with a 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}.
	 * @see module:client/multi~Multi#autoJoinSession
	 */
	exports.extractTokenFromURL = function () {
		var sessionToken = window.location.hash.substring(1);

		if (sessionToken === undefined || sessionToken === '') {
			return Q.reject(new errors.NoSessionTokenFoundError());
		} else {
			return Q.resolve(sessionToken);
		}
	};


	/**
	 * Small helper class for managing symbol fields to connect to existing
	 * sessions. The user can click on each symbol to toggle its state - all
	 * activated symbols will then build the session token.<br>
	 * -  -  #<br>
	 * #  -  -<br>
	 * -  -  #<br>
	 * for example will convert to the token '238' - the indices of all activated
	 * symbols.
	 * @param {integer} symbolCount  number of symbols you want to have
	 *  in your grid
	 *  
	 * @example
	 * var symbols = SymbolArray(9);
	 *
	 * function onIconClick(event) {
	 *   var icon = $(event.currentTarget);
	 *   var isActive = symbolArray.toggle(icon.index());
	 *   var classes = isActive ? 'active' : 'inactive';
	 *   icon.attr('class', classes);
	 * }
	 *
	 * // .... later on:
	 * var token = symbols.toToken();
	 * multi.joinSession(token);
	 */
	exports.SymbolArray = function (symbolCount) {
		this.symbols = new Array(symbolCount);
	};

	/**
	 * Toggles the selected state of the symbol at the given index.
	 * @param  {integer} position index of the symbol you want to change
	 * @return {boolean}         true if the symbol at the given index
	 *  is now selected, false otherwise
	 */
	exports.SymbolArray.prototype.toggle = function (position) {
		this.symbols[position] =! this.symbols[position];
		return this.symbols[position];
	};

	/**
	 * @return {string} the token representation of this symbol array
	 */
	exports.SymbolArray.prototype.toToken = function () {
		return this.symbols.reduce(function (x, y, index) {
			return y ? x + index : x;
		}, '');
	};

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/


/**
 * This module contains classes and utils that are useful
 * for working with multiple screens. To use a ScreenArranger inside your
 * game look up the 
 * {@link module:plugins/screens.HorizontalArranger|HorizontalArranger}
 * documentation.
 * @module plugins/screens
 */
define('../plugins/screens/index',['require','exports','module','events','util'],function(require, exports, module) {
	'use strict';

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');

	/**
	 * @classdesc When any ScreenArranger is used, an instance of this 
	 * class will be added to every player. Here you can find all
	 * information and helper methods relevant for positioning one 
	 * screen on a bigger playing field.
	 * @class
	 * @param {module:shared/player~Player} 
	 *  player player instance this screen is added to
	 */
	exports.Screen = function (player) {
		/**
		 * width of the screen in pixel
		 * @type {integer}
		 */
		this.width = player.width;
		/**
		 * height of the screen in pixel
		 * @type {integer}
		 */
		this.height = player.height;
		/**
		 * player instance this screen is added to
		 * @type {module:shared/player~Player}
		 */
		this.player = player;
		/**
		 * global x-position (from left) of this screen in pixel
		 * @type {integer}
		 */
		this.x = null;
		/**
		 * global x-position (from top) of this screen in pixel
		 * @type {integer}
		 */
		this.y = null;
		/**
		 * list of all player instances that border on the right
		 * side of this screen
		 * @type {Array}
		 */
		this.rightPlayers = [];
		/**
		 * list of all player instances that border on the left
		 * side of this screen
		 * @type {Array}
		 */
		this.leftPlayers = [];
		/**
		 * list of all player instances that border on the top
		 * of this screen
		 * @type {Array}
		 */
		this.topPlayers = [];
		/**
		 * list of all player instances that border on the bottom
		 * of this screen
		 * @type {Array}
		 */
		this.bottomPlayers = [];
	};

	/**
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given global coordinates lie inside 
	 * the this screen object, else false
	 * @private
	 */
	exports.Screen.prototype.isHit = function (x, y) {
		return x >= this.x &&
			x < this.x + this.width &&
			y >= this.y &&
			y < this.y + this.height;
	};

	/**
	 * @param  {integer}  x      global x-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  y      global y-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  width  width of the rectangle in pixel
	 * @param  {integer}  height height of the rectangle in pixel
	 * @return {boolean}         true if the given rectangle or parts of it 
	 *  overlap with this screen
	 */
	exports.Screen.prototype.isHitByRect = function (x, y, width, height) {
		return x + width >= this.x &&
			y + height >= this.y &&
			x < this.x + this.width &&
			y < this.y + this.height;
	};

	/**
	 * Converts local pixel coordinates to global ones, using this screen
	 * as local coordinate system.
	 * @param  {integer} x  local x position in pixel
	 * @param  {integer} y  local y position in pixel
	 * @return {object}  { x: globalX, y: globalY }
	 */
	exports.Screen.prototype.localToGlobal = function (x, y) {
		return { x: this.x + x, y: this.y + y };
	};

	/**
	 * Converts global pixel coordinates to local ones, using this screen
	 * as local coordinate system.
	 * @param  {integer} x  global x position in pixel
	 * @param  {integer} y  global y position in pixel
	 * @return {object}  { x: localX, y: localY, player: this.player }
	 */
	exports.Screen.prototype.globalToLocal = function (x, y) {
		return { x: x - this.x, y: y - this.y, player: this.player };
	};


	/**
	 * @classdesc This is the base class for arranging players of the given
	 * session to one big playing field. It will add a 
	 * {@link module:plugins/screens.Screen|screen} attribute to every joined 
	 * player.<br><br>
	 * Feel free to extend this class to create your own ScreenArranger. You
	 * can use {@link module:plugins/screens.HorizontalArranger} 
	 * as example implementation.
	 * @class
	 * @mixes external:EventEmitter
	 * @param {module:shared/session~Session}
	 *  Session that contains the players that should be arranged into
	 *  one big screen.
	 */
	exports.ScreenArranger = function (session) {

		EventEmitter.call(this);

		/**
		 * Session that is getting arranged into one big game screen
		 * @type {module:shared/session~Session}
		 * @readonly
		 */
		this.session = session;
		/**
		 * total width of the big screen in pixel
		 * @type {integer}
		 * @readonly
		 */
		this.width = 0;
		/**
		 * total height of the big screen in pixel
		 * @type {integer}
		 * @readonly
		 */
		this.height = 0;

		// add a screen to every player...
		session.getPlayerArray().forEach(function (player) {
			player.screen = new exports.Screen(player);
		});
		this.refresh();

		// ...and every player that will come
		session.on('playerJoined', this.onPlayerJoined.bind(this));
		session.on('playerLeft', this.onPlayerLeft.bind(this));
	};

	util.inherits(exports.ScreenArranger, EventEmitter);

	/**
	 * Converts local pixel coordinates to global ones.
	 * @param  {module:shared/player~Player} player 
	 *  player instance the local coordinates refer to
	 * @param  {integer} x  local x position in pixel
	 * @param  {integer} y  local y position in pixel
	 * @return {object}  { x: globalX, y: globalY } or null if the given
	 *  player is no part of this arranger
	 */
	exports.ScreenArranger.prototype.localToGlobal = function (player, x, y) {
		return player.screen.localToGlobal(x, y);
	};

	/**
	 * Determines which Player overlaps with the given rectangle.
	 * @param  {integer}  x      global x-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  y      global y-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  width  width of the rectangle in pixel
	 * @param  {integer}  height height of the rectangle in pixel
	 * @return {Array}    list of local objects of the form 
	 *  { x: localX, y: localY, player: hitPlayer }. X and y are the upper-left
	 *  corner of the given rectangle in the players local coordinate system.
	 * @see module:plugins/screens.Screen#globalToLocal
	 * @see module:plugins/screens.Screen#isHitByRect
	 */
	exports.ScreenArranger.prototype.globalRectToLocals = function (x, y, width, height) {
		var locals = {};
		var screen;
		for (var i in this.session.players) {
			screen = this.session.players[i].screen;
			if (screen.isHitByRect(x, y, width, height)) {
				locals[screen.player.id] = screen.globalToLocal(x, y);
			}
		}

		return locals;
	};

	/**
	 * Determines which Player overlaps with the given point and returns
	 * it in his local coordinates.
	 * @param  {integer}  x      global x-coordinate of in pixel
	 * @param  {integer}  y      global y-coordinate of in pixel
	 * @return {object|null}     local object of the form 
	 *  { x: localX, y: localY, player: hitPlayer } or null.
	 * @see module:plugins/screens.Screen#globalToLocal
	 */
	exports.ScreenArranger.prototype.globalToLocal = function (x, y) {
		var player = this.getPlayerAtCoords(x, y);
		if (player === null) {
			return null;
		} else {
			return player.screen.globalToLocal(x, y);
		}
	};

	/**
	 * @param  {module:shared/player~Player} player 
	 *  any player object connected to the arranged session
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given coordinates lie within
	 * the screen of the given player
	 */
	exports.ScreenArranger.prototype.isPlayerHit = function (player, x, y) {
		return player.screen.isHit(x, y);
	};

	/*
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given coordinates lie within
	 * the screen of any player, false otherwise
	 */
	exports.ScreenArranger.prototype.isAnyPlayerHit = function (x, y) {
		return this.getPlayerAtCoords(x, y) !== null;
	};

	/**
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {module:shared/player~Player}
	 *  player object whose screen lies beneath the given coordinates
	 *  or null when no player can be found at this position
	 */
	exports.ScreenArranger.prototype.getPlayerAtCoords = function (x, y) {
		for (var i in this.session.players) {
			var screen = this.session.players[i].screen;
			if (screen.isHit(x, y)) {
				return screen.player;
			}
		}
		return null;
	};

	/**
	 * This method by default gets called whenever a new player joins
	 * the underlying session. It calls
	 * {@link module:plugins/screens.ScreenArranger#arrange|arrange} and 
	 * {@link module:plugins/screens.ScreenArranger#recaculateDimentions|recaculateDimentions}. <br>
	 * You can override this method to write your own screen arranger.
	 * In this case please make sure to arrange every player and 
	 * update the dimentions of the whole playing field accordingly.
	 */
	exports.ScreenArranger.prototype.refresh = function () {
		this.arrange();
		this.recaculateDimentions();
		this.emit('arrangementChanged');
	};

	/**
	 * This method is called by the 
	 * {@link module:plugins/screens.ScreenArranger#refresh|refresh} 
	 * method by default. It takes the global position and dimentions of every 
	 * player into account to update the global playing field width and height 
	 * accordingly.<br>
	 * You may override this method or call it from any overridden method.
	 */
	exports.ScreenArranger.prototype.recaculateDimentions = function () {
		var maxX = 0;
		var maxY = 0;
		this.session.getPlayerArray().forEach(function (player) {
			maxX = Math.max(maxX, player.screen.x + player.screen.width);
			maxY = Math.max(maxY, player.screen.y + player.screen.height);
		});
		this.width = maxX;
		this.height = maxY;
	};

	/**
	 * This method is called by the 
	 * {@link module:plugins/screens.ScreenArranger#refresh|refresh} method by default. 
	 * It does  nothing for this base class and should be overridden by every 
	 * child class.<br><br>
	 * Please make sure to update the positions of every players screen here.
	 * @abstract
	 */
	exports.ScreenArranger.prototype.arrange = function () {
		// this does nothing!
	};

	/**
	 * This method is callen whenever a new player joins the session.
	 * Feel free to override. In this case you may want to create a new
	 * screen for the player and call your refresh method.
	 * @param event
	 */
	exports.ScreenArranger.prototype.onPlayerJoined = function (event) {
		event.player.screen = new exports.Screen(event.player);
		this.refresh();
	};

	/**
	 * This method is callen whenever a new player leaves the session.
	 * Feel free to override. In this case you may want to call your 
	 * refresh method.
	 * @param event
	 */
	exports.ScreenArranger.prototype.onPlayerLeft = function (event) {
		this.refresh();
	};

	/**
	 * Fired when the screen layout changes. This may be because a player
	 * joined or left the session.
	 * @event module:plugins/screens.ScreenArranger#arrangementChanged
	 */

	return exports;

});
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/



define('../plugins/screens/HorizontalArranger',['require','exports','module','util','./index'],function(require, exports, module) {
	'use strict';

	var util = require('util');
	var screensModule = require('./index');
	var ScreenArranger = screensModule.ScreenArranger;

	/**
	 * @classdesc This class arranges the screens of the every player 
	 * horizontally. Player with lower playerNumbers will be farer left.
	 * @example
	 * --------    ------------
	 * |      |----|          |
	 * |  p1  | p2 |    p3    |
	 * |      |----|          |
	 * --------    ------------
	 * @example
	 * var arranger = new multiModule.screens.HorizontalArranger(session);
	 * var firstPlayer = session.getPlayerByNumber(0);
	 * console.log(firstPlayer.screen.x);
	 * console.log(firstPlayer.screen.y);
	 * console.log(firstPlayer.screen.width);
	 * console.log(firstPlayer.screen.height);
	 * @class
	 * @mixes module:plugins/screens.ScreenArranger
	 * @memberOf module:plugins/screens
	 * @param {module:shared/session~Session} 
	 *  session session instance whose player you want to be arranged.
	 */
	var HorizontalArranger = function (session) {
		ScreenArranger.call(this, session);
	};
	util.inherits(HorizontalArranger, ScreenArranger);

	HorizontalArranger.prototype.arrange = function () {
		var height = 0;
		var xPos = 0;
		var yPos;
		var lastPlayer = null;
		var players = this.session.getPlayerArray();
		players.forEach(function (player) {
			height = Math.max(height, player.height);
			player.screen.leftPlayers = [];
			player.screen.rightPlayers = [];
		});
		players.forEach(function (player) {
			yPos = Math.round((height - player.height) / 2);
			player.screen.x = xPos;
			player.screen.y = yPos;
			if (lastPlayer !== null) {
				player.screen.leftPlayers = [ lastPlayer ];
				lastPlayer.screen.rightPlayers = [ player ];
			}
			xPos += player.width;
			lastPlayer = player;
		});

		this.width = xPos;
		this.height = height;
	};

	// this is already done inside arrange
	HorizontalArranger.prototype.recaculateDimentions = function () {};

	screensModule.HorizontalArranger = HorizontalArranger;
	exports = HorizontalArranger;
	return exports;

});
/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
* @example
* // configure where multi can find your client side socket.io lib
requirejs.config({
  paths: {
    'socket.io': '/socket.io/socket.io.js'
  }
});

var multiOptions = {
  server: 'http://mySocketioServer/'
};

// init and try to create the session
var multi = multiModule.init(multiOptions);
multi.createSession().then(onSession, onSessionFailed).done();
*/



define('multi',['require','exports','module','events','util','./session','../shared/color','../shared/errors','./token','../plugins/screens/index','../plugins/screens/HorizontalArranger','../lib/q','socket.io'],function(require, exports, module) {
	'use strict';

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var sessionModule = require('./session');
	var color = require('../shared/color');
	var errors = require('../shared/errors');
	var token = require('./token');
	var screensModule = require('../plugins/screens/index');
	var HorizontalArranger = require('../plugins/screens/HorizontalArranger');
	var Q = require('../lib/q');
	var io = require('socket.io');

	Q.stopUnhandledRejectionTracking();

	var instance = null;


	/**
	* @typedef {Object} module:client/multi~MultiOptions
	* @property                   server    full url of a running socket.io server
	* @property {SessionOptions}  [session] default options for session creation
	*/

	/**
	 * @typedef {(string|Array.<string>|module:client/player~Player)} module:client/multi~toClient
	 * @description  Option to determine to which client a message should be send
	 * (not to which _instance_ on this client).<br>
	 * You can set it to:
	 * <ul>
	 * <li>'all' - the message will be send to all clients currently connected to
	 * this session</li>
	 * <li>'all-but-myself' - the message will be send to all clients currently 
	 * connected to this session except the sending client </li>
	 * <li>'server' - the message will be send to the game server only</li>
	 * <li>[player1, player2] - message will be send to all clients that are
	 * represented by players inside this array</li>
	 * <li>myPlayer - the message will be send to the client that is represented
	 * by myPlayer</li>
	 * </ul>
	 */

	/**
	 * A promise object provided by the q promise library.
	 * @external Promise
	 * @see {@link https://github.com/kriskowal/q/wiki/API-Reference}
	 */


	/**
	* @classdesc Use this class to create new sessions or connect to 
	* existing ones. You can get ready a to use instance of this class
	* by initializing the multi framework with 
	* {@link module:client/multi.init multiModule.init(options)}.
	* @inner
	* @protected
	* @memberof module:client/multi
	* @class
	* @param {module:client/multi~MultiOptions} options to tweak this instances behaviour  
	*/
	var Multi = function (options) {
		this.server = options.server;
		this.sessionOptions = options.session;
	};

	/**
	 * Tries to connect to a session that does already exist on the server. 
	 * The session token will be extracted from the URL by using characters 
	 * after the url hash.<br>
	 * As this operation is executed asynchrony a Q promise will be returned.
	 *
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the joined {@link module:client/session~Session Session} instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:shared/errors.SessionFullError SessionFullError}, 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}, 
	 * {@link module:shared/errors.NoSessionTokenFoundError NoSessionTokenFoundError}, 
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 */
	Multi.prototype.autoJoinSession = function () {
		var multi = this;
		return token.extractTokenFromURL().then(function (token) {
			return multi.joinSession(token);
		});
	};

	/**
	 * Tries to auto join an existing session.
	 * When no valid session token can be extracted from the URL a
	 * new session will be created instead.<br>
	 * As this operation is executed asynchrony a Q promise will be returned.
	 *
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the created or joined {@link module:client/session~Session Session} 
	 * instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:shared/errors.SessionFullError SessionFullError}, 
	 * {@link module:shared/errors.TokenAlreadyExistsError TokenAlreadyExistsError}, 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}, 
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 */
	Multi.prototype.autoJoinOrCreateSession = function () {
		var that = this;

		return this.autoJoinSession().catch(function (error) {
			if (error instanceof errors.NoSessionTokenFoundError) {
				return that.createSession();
			} else {
				throw error;
			}
		});
	};

	/**
	 * Opens a socket connection to the configured server.
	 * @return {external:Promise} On success the promise will be resolved with
	 *  the connected socket object. When the connection fails or another error
	 *  (eg. a timeout) occurs, the promise will be rejected with a
	 *  {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 * @private
	 */
	Multi.prototype.openSocketConnection = function () {
		var deferred = Q.defer();
		var socket = io.connect(this.server, {
				reconnect: false,
				'force new connection': true
			});
		socket.on('connect', function () {
			deferred.resolve(socket);
		});

		var onError = function () {
			deferred.reject(new errors.NoConnectionError());
		};
		socket.on('connect_failed', onError);
		socket.on('error', onError);

		return deferred.promise;
	};

	/**
	 * Tries to connect to a session that does already exist on the server. 
	 * As this operation is executed asynchrony a Q promise will be returned.
	 * @param {string} sessionToken  unique token of the session you want
	 * to join
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the joined {@link module:client/session~Session Session} instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:shared/errors.SessionFullError SessionFullError}, 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError},
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 *
	 * @example
	 * var multiOptions = {
	 *  server: 'http://mySocketioServer/'
	 * };
	 *
	 * function onSession(session) {
	 *  console.log('session joined', session.token);
	 * }
	 * function onSessionFailed(error) {
	 *  console.log('session joining failed:', error.message);
	 * }
	 *
	 * // init and join the session
	 * var multi = multiModule.init(multiOptions);
	 * multi.joinSession('123').then(onSession, onSessionFailed).done();
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		var multi = this;
		
		return this.openSocketConnection().then(function (socket) {
			var deferred = Q.defer();

			socket.on('sessionJoined', function (data) {
				var session = sessionModule.deserialize(data, socket);
				deferred.resolve(session);
			});

			socket.on('joinSessionFailed', function (data) {
				var error;
				if (data.reason === 'sessionNotFound') {
					error = new errors.NoSuchSessionError();
				} else if (data.reason === 'sessionFull') {
					error = new errors.SessionFullError();
				} else if (data.reason === 'joiningDisabled') {
					error = new errors.JoiningDisabledError();
				}
				deferred.reject(error);
			});

			socket.emit('joinSession', {
				token: sessionToken,
				playerParams: multi.getPlayerParams()
			});

			return deferred.promise;
		});
	};

	/**
	 * Tries to create a new game session on the server. As this
	 * operation is executed asynchrony a Q promise will be returned.
	 * @param {SessionOptions} [options]  To tweak this new sessions behaviour.
	 * If not provided, the session section of the multiOptions-object will
	 * be used. If that does not exist either the default values will be used.
	 *
	 * @return {external:Promise} On success the promise will be resolved with the 
	 * created {@link module:client/session~Session Session} instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.TokenAlreadyExistsError TokenAlreadyExistsError},<br>
	 * {@link module:shared/errors.ScriptNameNotAllowedError ScriptNameNotAllowedError},
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 *
	 * @example
	 * var multiOptions = {
	 *  server: 'http://mySocketioServer/',
	 *  session: {
	 *    minPlayerNeeded: 3,
	 *    maxPlayerAllowed: 5
	 *  }
	 * };
	 *
	 * function onSession(session) {
	 *  console.log('session created', session.token);
	 * }
	 * function onSessionFailed(error) {
	 *  console.log('session creation failed:', error.message);
	 * }
	 *
	 * // init and try to create the session
	 * var multi = multiModule.init(multiOptions);
	 * multi.createSession().then(onSession, onSessionFailed).done();
	 */
	Multi.prototype.createSession = function (options) {
		var multi = this;
		options = options || this.sessionOptions || {};

		return this.openSocketConnection().then(function (socket) {
			var deferred = Q.defer();

			socket.on('sessionCreated', function (data) {
				var session = sessionModule.deserialize(data, socket);
				deferred.resolve(session);
			});

			socket.on('createSessionFailed', function (event) {
				if (event.reason === 'tokenAlreadyExists') {
					deferred.reject(new errors.TokenAlreadyExistsError());
				} else if (event.reason === 'scriptNameNotAllowed') {
					deferred.reject(new errors.ScriptNameNotAllowedError());
				} else {
					deferred.reject(new errors.MultiError(event.reason));
				}
			});

			socket.emit('createSession', {
				options: options,
				playerParams: multi.getPlayerParams()
			});

			return deferred.promise;
		});
	};

	/**
	 * @returns {module:server/player~PlayerParams} an object containing
	 * device information for this client
	 * @private
	 */
	Multi.prototype.getPlayerParams = function () {
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	};


	/**
	 * @public
	 * @param {module:client/multi~MultiOptions} options to tweak this modules behaviour  
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


	/**
	 * @type module:shared/errors.MultiError
	 */
	exports.MultiError = errors.MultiError;

	/**
	 * @type module:shared/errors.NoSuchSessionError
	 */
	exports.NoSuchSessionError = errors.NoSuchSessionError;

	/**
	 * @type module:shared/errors.TokenAlreadyExistsError
	 */
	exports.TokenAlreadyExistsError = errors.TokenAlreadyExistsError;

	/**
	 * @type module:shared/errors.SessionFullError
	 */
	exports.SessionFullError = errors.SessionFullError;

	/**
	 * @type module:shared/errors.NoConnectionError
	 */
	exports.NoConnectionError = errors.NoConnectionError;

	/**
	 * @type module:shared/errors.NoSessionTokenFoundError
	 */
	exports.NoSessionTokenFoundError = errors.NoSessionTokenFoundError;

	/**
	 * @type module:shared/errors.JoiningDisabledError
	 */
	exports.JoiningDisabledError = errors.JoiningDisabledError;

	/**
	 * @type module:shared/errors.ScriptNameNotAllowedError
	 */
	exports.ScriptNameNotAllowedError = errors.ScriptNameNotAllowedError;

	/**
	 * @type module:client/events.EventEmitter
	 */
	exports.EventEmitter = EventEmitter;

	/**
	 * @type module:client/util
	 */
	exports.util = util;

	/**
	 * @type module:shared/color
	 */
	exports.color = color;

	/**
	 * @type module:client/token
	 */
	exports.token = token;

	/**
	 * @type module:plugins/screens
	 */
	exports.screens = screensModule;
	exports.screens.HorizontalArranger = HorizontalArranger;

});
define(["multi"], function(index) { return index; });
//# sourceMappingURL=multi.js.map