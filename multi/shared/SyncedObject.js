/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(function(require, exports, module) {

	var WatchJS = require('../lib/watch');
	var EventEmitter = require('events').EventEmitter;
	var util = require('util');


	var SyncedObject = function () {

		EventEmitter.call(this);

		this.data = {};
		this.onAttributesChange = this.onAttributesChange.bind(this);

	};

	util.inherits(SyncedObject, EventEmitter);


	SyncedObject.prototype.startWatching = function () {
		WatchJS.watch(this.data, this.onAttributesChange, 0, true);
	};

	SyncedObject.prototype.stopWatching = function () {
			WatchJS.unwatch(this.attributes, this.onAttributesChange);
	};

	SyncedObject.prototype.onAttributesChange = function (prop, action, newvalue, oldvalue) {
		this.emit('attributesChange');
	};

	exports = SyncedObject;
	return exports;

});