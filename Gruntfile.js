module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jsdoc : {
			multi : {
				src: ['multi', 'README.md'], 
				options: {
					destination: './documentation/'
				}
			}
		},

		jshint: {
			files: ['Gruntfile.js', 'app.js', 'package.json', 'multi/**/*.js'],
			options: {
				// ignore third party libs
				ignores: ['node_modules', 'documentation'],
				// options here to override JSHint defaults
				globals: {
					jQuery: true,
					console: true,
					module: true,
					document: true
				}
			}
		},

		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['test']
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('default', ['test', 'jsdoc']);
};