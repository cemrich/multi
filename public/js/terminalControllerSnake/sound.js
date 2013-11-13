
define(['../lib/midi'], function (midi) {

	return {

		onJoystickDirectionChange: function () {
			midi.play('knock', 'C', 0.2);
		}

	};

});