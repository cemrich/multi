define(function(require, exports, module) {

	var HEADER = '0101212';
	var INTERVAL = 200;

	var AudioContext = window.AudioContext ||
		window.webkitAudioContext ||
		window.mozAudioContext;

	exports.isSupported = function () {
		return AudioContext;
	};

	var tune = document.querySelector('#tune');
	var audio = null;
	var interval = null;
	var position = 0;
	var song = '';
	var scale = {
		0: 440,
		1: 880,
		2: 1500
	};

	if (exports.isSupported()) {
		audio = new AudioContext();
	}

	function createOscillator(freq) {
		var duration = 200;
		var osc = audio.createOscillator();

		osc.frequency.value = freq;
		osc.type = 'sine'; // 'sine' works best but sounds worst
		osc.connect(audio.destination);
		osc.start(0);

		setTimeout(function() {
			osc.stop(0);
			osc.disconnect(audio.destination);
		}, duration);
	}

	function play() {
		var note = song.charAt(position++);
		var freq = scale[note];
		if (position >= song.length) {
			position = 0;
		}
		if (freq) {
			createOscillator(freq);
		}
		tune.style.opacity = 0.5 + note * 0.15;
	}

	exports.start = function (token) {
		song = HEADER + '-' + token + '-';
		console.log(song);
		interval = setInterval(play, INTERVAL);
	};

	exports.stop = function () {
		clearInterval(interval);
	};
});
