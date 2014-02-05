define(function(require, exports, module) {

	var HEADER = '0101212';
	var HALF_TOKEN_LENGTH = 4;

	var AudioContext = window.AudioContext ||
		window.webkitAudioContext ||
		window.mozAudioContext;
	var getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia;

	exports.isSupported = function () {
		return AudioContext && getUserMedia;
	};

	var microphone = document.querySelector('#microphone');
	var audioContext = null;
	var analyser = null;
	var notes = {
		0: 20,
		1: 41,
		2: 70
	};
	var begin = 18;
	var end = 72;
	var headerFound = false;
	var lastNote = null;
	var sequence = '';
	var onTokenFound = null;
	var source = null;
	var localStream = null;

	if (exports.isSupported()) {
		audioContext = new AudioContext();
		analyser = audioContext.createAnalyser();
	}

	function onNoteDetected(note) {
		microphone.style.opacity = 0.5 + note * 0.15;
		sequence += note;
		console.log(sequence);
		if (headerFound && sequence.length === HALF_TOKEN_LENGTH * 2) {
			headerFound = false;
			onTokenFound(sequence);
		}
		if (!headerFound && sequence.indexOf(HEADER) !== -1) {
			headerFound = true;
			sequence = '';
		}
	}

	function analyze() {
		window.requestAnimationFrame(analyze);
		var buffer = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(buffer);

		var max = 0;
		var maxi = 0;
		var sum = 0;
		for (var i = begin; i < end; i++) {
			var normalized = buffer[i];
			if (normalized > max) {
				max = normalized;
				maxi = i;
			}
			sum += normalized;
		}

		var average = sum / (end - begin);
		var threshold = 2;
		for (var note in notes) {
			if (max > average*1.3 &&
					maxi < notes[note]+threshold &&
					maxi > notes[note]-threshold &&
					note !== lastNote) {
				onNoteDetected(note);
				lastNote = note;
				break;
			}
		}
	}


	var microphoneError = function(e) {
		alert('Microphone error!', e);
	};

	exports.start = function (tokenCallback, recordCallback) {
		onTokenFound = tokenCallback;
		if (exports.isSupported()) {
			getUserMedia.call(navigator, {audio: true}, function(stream) {
				localStream = stream;
				recordCallback();
				source = audioContext.createMediaStreamSource(stream);
				source.connect(analyser);
				analyze();
			}, microphoneError);
		} else {
			alert('Your browser does not support getUserMedia.');
		}
	};

	exports.stop = function() {
		if (localStream !== null) {
			source.disconnect(analyser);
			localStream.stop();
			localStream = null;
		}
	};

	exports.HALF_TOKEN_LENGTH = HALF_TOKEN_LENGTH;

});
