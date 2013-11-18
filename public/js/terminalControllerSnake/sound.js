
define(['../lib/midi', '../lib/jquery-2.0.0.min'], function (midi) {

	var MUSIC_FADE_TIME = 1500;

	var bgAudio = $('#audio_bg');
	if (bgAudio[0]) {
		bgAudio[0].volume = 0.5;
	}

	function fadeBackgroundVolume(volume) {
		bgAudio.animate({volume: volume}, MUSIC_FADE_TIME, null);
	}

	return {

		onJoystickDirectionChange: function () {
			midi.play('knock', 'C', 0.2);
		},

		onSnakeMove: function () {
			midi.play('knock', 'G', 0.2);
		},

		onPoint: function () {
			midi.play('harpsichord', 'B', 0.2);
		},

		onDisconnect: function () {
			midi.play('bell', 'C', 0.2);
			fadeBackgroundVolume(0.5);
		},

		onConnect: function () {
			midi.play('bell', 'B', 0.2);
		},

		onError: function () {
			midi.play('harpsichord', 'C', 0.2);
		},

		onStartGame: function () {
			midi.play('bell', 'B', 0.2);
			fadeBackgroundVolume(0.15);
		},

		onGameOver: function () {
			midi.play('bell', 'C', 0.2);
			fadeBackgroundVolume(0.5);
		}

	};

});