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
			WatchJS.unwatch(this.data, this.onAttributesChange);
	};

	SyncedObject.prototype.applyChangesetSilently = function (changeset) {
		this.stopWatching();
		this.applyChangeset(changeset);
		this.startWatching();
	};

	SyncedObject.prototype.applyChangeset = function (changeset) {
		var propertyName;
		if (changeset.hasOwnProperty('changed')) {
			for (propertyName in changeset.changed) {
				this.data[propertyName] = changeset.changed[propertyName];
			}
		}
		if (changeset.hasOwnProperty('removed')) {
			for (var i in changeset.removed) {
				propertyName = changeset.removed[i];
				delete this.data[propertyName];
			}
		}
	};

	SyncedObject.prototype.onAttributesChange = function (property, action, newValue, oldValue) {
		var changed = {};
		var removed = [];

		if (property === 'root' && action === 'differentattr') {
			// some attributes have been added or deleted
			for (var i in newValue.added) {
				var propertyName = newValue.added[i];
				changed[propertyName] = this.data[propertyName];
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

		this.emit('attributesChanged', changeset);
	};


	exports = SyncedObject;
	return exports;

});