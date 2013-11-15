/**
 * Some helper function to manipulate canvas Pixel data.
 * @author Christine Coenen
 */

define(function () {

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h, s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param   Number  h	   The hue
	 * @param   Number  s	   The saturation
	 * @param   Number  l	   The lightness
	 * @return  Array		   The RGB representation
	 * @author  Ken Fyrstenberg
	 * @see     http://stackoverflow.com/questions/18800863/shift-rgb-one-color-to-another-color-of-image-html-5-canvas
	 */
	function hslToRgb(h, s, l){
		var r, g, b;

		if(s == 0){
			r = g = b = l; // achromatic
		}else{
			function hue2rgb(p, q, t){
				if(t < 0) t += 1;
				if(t > 1) t -= 1;
				if(t < 1/6) return p + (q - p) * 6 * t;
				if(t < 1/2) return q;
				if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		return [r * 255, g * 255, b * 255];
	}

	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and l in the set [0, 1].
	 *
	 * @param   Number  r	   The red color value
	 * @param   Number  g	   The green color value
	 * @param   Number  b	   The blue color value
	 * @return  Array		   The HSL representation
	 * @author  Ken Fyrstenberg
	 * @see     http://stackoverflow.com/questions/18800863/shift-rgb-one-color-to-another-color-of-image-html-5-canvas
	 */
	function rgbToHsl(r, g, b){
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min){
			h = s = 0; // achromatic
		}else{
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}

		return [h, s, l];
	}

	function rotateHueValue(r, g, b, value) {
		var hsl = rgbToHsl(r, g, b);
		hsl[0] += value;
		hsl[0] %= 1;
		return hslToRgb(hsl[0], hsl[1], hsl[2]);
	}

	function rotateHue(canvas, value) {
		var ctx = canvas.getContext('2d');
		var imageData = ctx.getImageData(0, 0, 22, 22);
		var pixels = imageData.data;  
		var numPixels = imageData.width * imageData.height * 4;
		for (var i = 0; i < numPixels; i+=4) {
			var rotated = rotateHueValue(pixels[i], pixels[i+1], pixels[i+2], value);
			pixels[i] = rotated[0];
			pixels[i+1] = rotated[1];
			pixels[i+2] = rotated[2];
		};
		ctx.clearRect(0, 0, canvas.width, canvas.height);  
		ctx.putImageData(imageData, 0, 0);
	}

	function replaceHues(canvas, rgb) {
		var newValue = rgbToHsl(rgb.r, rgb.g, rgb.b)[0];
		var ctx = canvas.getContext('2d');
		var imageData = ctx.getImageData(0, 0, 22, 22);
		var pixels = imageData.data;  
		var numPixels = imageData.width * imageData.height * 4;
		for (var i = 0; i < numPixels; i+=4) {
			var hsl = rgbToHsl(pixels[i], pixels[i+1], pixels[i+2]);
			hsl[0] = newValue;
			var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
			pixels[i] = rgb[0];
			pixels[i+1] = rgb[1];
			pixels[i+2] = rgb[2];
		};
		ctx.clearRect(0, 0, canvas.width, canvas.height);  
		ctx.putImageData(imageData, 0, 0);
	}

	return {
		rotateHue: rotateHue,
		replaceHues: replaceHues
	};

});