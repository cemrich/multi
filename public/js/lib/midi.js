/*
A very basic sound synthesizing library. 

Usage:
midi.play(<instrument>, <tune>, <volume>); 

e.g.
midi.play('piano', 'C', 0.7); 
*/


define(function () {

	var Context = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
	var audio = Context ? new Context() : null;

	var NOTES = {
		C: 261.626,
		Db: 277.183,
		D: 293.665,
		Eb: 311.127,
		E: 329.628,
		F: 349.228,
		Gb: 369.994,
		G: 391.995,
		Ab: 415.305,
		A: 440,
		Bb: 466.164,
		B: 493.883
	};

	var INSTRUMENTS = {
		piano: {
			attack: 2,
			decay: 500,
			type: 'square'
		},
		bell: {
			attack: 5,
			decay: 600,
			type: 'sine'
		},
		flute: {
			attack: 100,
			decay: 500,
			type: 'sine'
		},
		harpsichord: {
			attack: 5,
			decay: 350,
			type: 'sawtooth'
		},
		knock: {
			attack: 10,
			decay: 60,
			type: 'triangle'// sine square sawtooth triangle
		}
	}

	function createOscillator(freq, attack, decay, type, volume) {
		var gain = audio.createGain();
		var osc = audio.createOscillator();

		osc.frequency.value = freq;
		osc.type = type;
		osc.connect(gain);

		osc.start(0);
		gain.connect(audio.destination);
		gain.gain.setValueAtTime(0, audio.currentTime);
		gain.gain.linearRampToValueAtTime(volume, audio.currentTime + attack / 1000);
		gain.gain.linearRampToValueAtTime(0, audio.currentTime + decay / 1000);

		setTimeout(function() {
			osc.stop(0);
			osc.disconnect(gain);
			gain.disconnect(audio.destination);
		}, decay+200)
	}

	function play(instrument, note, volume) {
		if (audio === null) {
			return;
		}

		volume = volume || 1;
		var intr = INSTRUMENTS[instrument];
		createOscillator(NOTES[note], intr.attack, intr.decay, intr.type, volume);
	}

	function isSupported() {
		return Context;
	}

	return {
		play: play,
		isSupported: isSupported,
		NOTES: Object.keys(NOTES),
		INSTRUMENTS: Object.keys(INSTRUMENTS)
	};

});