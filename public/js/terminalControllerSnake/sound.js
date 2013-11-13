
define(['../lib/midi'], function (midi) {

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
		},

		onError: function () {
			midi.play('harpsichord', 'C', 0.2);
		},

		onStartGame: function () {
			midi.play('bell', 'B', 0.2);
		},

		onGameOver: function () {
			midi.play('bell', 'C', 0.2);
		}

	};

});