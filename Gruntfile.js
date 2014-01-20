module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jsdoc : {
			multi : {
				src: ['multi/client/**/*.js', 'multi/server/**/*.js', 'multi/shared/**/*.js', 'README.md'],
				options: {
					destination: './public/documentation/',
					private: false
				}
			}
		},

		jshint: {
			files: ['Gruntfile.js', 'app.js', 'package.json', 'multi/**/*.js', 'tests/**/*.js',
				'public/js/**/*.js', 'games/**/*.js', '.jshintrc'],
			options: {
				// ignore third party libs
				ignores: ['node_modules', 'documentation', 'multi/lib/*', 'tests/client/lib/*.js', 'public/js/lib/*'],
				// loading jshintrc config file
				jshintrc: '.jshintrc',
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
					name: 'multi',
					paths: {
						'socket.io': 'empty:'
					},
					wrap: {
						end: 'define(["multi"], function(index) { return index; });'
					},
					optimize: 'none',
					generateSourceMaps : true,
					preserveLicenseComments : false
				}
			}
		},

		// client side testing
		qunit: {
			files: ['tests/client/**/*.html']
		},

		watch: {
			// test js files on file change
			all: {
				files: ['<%= jshint.files %>'],
				tasks: ['jshint']
			},
			// build client lib on file change
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

	function filterQunitResult(error, result, code) {
		if (error) {
			grunt.log.error(error);
		} else {
			if (result.toString().indexOf('Error') !== -1) {
				grunt.log.write(result + '\n');
				throw 'Something above threw an error \u2191';
			} else {
				grunt.log.write(result);
			}
		}
	}

	// server side testing
	grunt.registerTask('qunitServer', function()
	{
		var done = this.async();
		var options = {
			cmd: 'node',
			args: ['tests/server/run']
		};
		function finishCallback(error, result, code) {
			filterQunitResult(error, result, code);
			// notify grunt that the async task has finished
			done();
		}
		grunt.util.spawn(options, finishCallback);
	});

	// shared lib testing
	grunt.registerTask('qunitShared', function()
	{
		var done = this.async();
		var options = {
			cmd: 'node',
			args: ['tests/shared/run']
		};
		function finishCallback(error, result, code) {
			filterQunitResult(error, result, code);
			// notify grunt that the async task has finished
			done();
		}
		grunt.util.spawn(options, finishCallback);
	});

	grunt.registerTask('qunitAll', ['qunit', 'qunitServer', 'qunitShared']);
	grunt.registerTask('test', ['jshint', 'qunitAll']);
	grunt.registerTask('default', ['jsdoc']);
};