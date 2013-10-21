module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jsdoc : {
			multi : {
				src: ['multi/**/*.js', 'README.md'], 
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

		/* 
		* builds the client side multi lib into one file 
		* see https://github.com/gruntjs/grunt-contrib-requirejs
		*/
		requirejs: {
			client: {
				options: {
					baseUrl: 'multi/client',
					out: 'public/js/lib/multi.js',
					name: 'main',
					optimize: 'none'
				}
			}
		},

		watch: {
			/* test js files on file change */
			all: {
				files: ['<%= jshint.files %>'],
				tasks: ['test']
			},
			/* build client lib on file change */
			client: {
				files: ['multi/client/**/*.js', 'multi/shared/**/*.js'],
				tasks: ['requirejs:client']
			}
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('default', ['test', 'jsdoc']);
};