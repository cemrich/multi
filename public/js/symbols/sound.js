/* global jsfxlib */

define(['exports', '../lib/audio', '../lib/jsfx', '../lib/jsfxlib'], function (exports) {

	var samples = null;

	/* exports */
	exports.init = function() {
		var audioLibParams = {
			ring : ['sine',0.0000,0.4000,0.0000,0.0000,0.1800,0.8680,20.0000,179.0000,746.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.3740,0.1800,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000],
			beat : ['square',0.0000,0.1920,0.0000,0.0000,0.4020,0.0840,25.0000,702.0000,47.0000,-0.0020,0.0000,0.0000,0.0100,0.0003,0.0000,0.2040,0.2620,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000],
			beat2 : ['square',0.0000,0.1920,0.0000,0.0000,0.4020,0.0640,25.0000,465.0000,47.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.2040,0.2620,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000],
			lost: ['sine',0.0000,0.4000,0.0000,0.0000,0.1170,0.8500,97.0000,223.0000,883.0000,-0.1360,-0.6900,0.0000,0.0100,0.2434,-0.1680,0.1360,0.2030,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
		};
		samples = jsfxlib.createWaves(audioLibParams);
	};

	function play(key) {
		try {
			samples[key].currentTime = 0;
			samples[key].play();
		} catch(e) {}
	}

	exports.onButton = function() { play('beat2'); };
	exports.onSymbol = function() { play('beat'); };
	exports.onPlayerJoin = function() { play('ring'); };
	exports.onPlayerDisconnect = function() { play('lost'); };
	exports.onStart = function() { play('beat'); };

	return exports;
});