/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(function(require, exports, module) {
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