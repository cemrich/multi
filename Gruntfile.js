module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jsdoc : {
			multi : {
				src: ['multi/client/**/*.js', 'multi/server/**/*.js', 'multi/shared/**/*.js', 'README.md'],
				options: {
					destination: './documentation/',
					private: false
				}
			}
		},

		jshint: {
			files: ['Gruntfile.js', 'app.js', 'package.json', 'multi/**/*.js', 'tests/**/*.js', 'public/js/**/*.js', '.jshintrc'],
			options: {
				// ignore third party libs
				ignores: ['node_modules', 'documentation', 'multi/debs/*', 'tests/client/lib/*.js', 'public/js/lib/*'],
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
					name: 'index',
					wrap: {
						end: 'define(["index"], function(index) { return index; });'
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
				files: ['Gruntfile.js', 'app.js', 'package.json', 'multi/**/*.js', 'tests/**/*.js', 'public/js/**/*.js'],
				tasks: ['jshint'],
				options: {
					spawn: false
				}
			},
			// build and test client lib on file change
			client: {
				files: ['multi/client/**/*.js', 'multi/shared/**/*.js'],
				tasks: ['requirejs:client', 'qunit', 'qunitShared']
			},
			// test server lib on file change
			server: {
				files: ['multi/server/**/*.js', 'multi/shared/**/*.js'],
				tasks: ['qunitServer', 'qunitShared']
			},
			// test server on test change
			testsServer: {
				files: ['tests/server/**/*.js'],
				tasks: ['qunitServer']
			},
			// test shared on test change
			testsShared: {
				files: ['tests/shared/**/*.js'],
				tasks: ['qunitShared']
			},
			// test client on test change
			testsClient: {
				files: ['tests/client/**/*.js'],
				tasks: []
			}
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	// on watch events configure jshint to only run on changed file
	grunt.event.on('watch', function(action, filepath) {
		grunt.config('jshint.files', filepath);
	});

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
	grunt.registerTask('default', ['test', 'jsdoc']);
};