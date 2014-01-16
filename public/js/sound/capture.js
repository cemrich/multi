define(function(require, exports, module) {

	var HEADER = '010101212';
	var TOKEN_LENGTH = 8;

	var AudioContext = window.AudioContext ||
		window.webkitAudioContext ||
		window.mozAudioContext;
	var getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia;

	var microphone = document.querySelector('#microphone');
	var audioContext = new AudioContext();
	var analyser = audioContext.createAnalyser();
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

	function onNoteDetected(note) {
		microphone.style.opacity = 0.5 + note * 0.15;
		sequence += note;
		if (headerFound && sequence.length === TOKEN_LENGTH * 2 - 1) {
			headerFound = false;
			var decoded = '';
			for (var i = 0; i < sequence.length; i += 2) {
				decoded += sequence.charAt(i);
			}
			onTokenFound(decoded);
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
		if (getUserMedia) {
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

});
