
//
// # Gruntfile.js
//
// (C) 2013 dotfold
//

/* global module */
/* global require */

module.exports = function(grunt) {

	'use strict';

    // load grunt tasks
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-compass");
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-docco2");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-open");

    var userConfig = require( './build.config.js' );

	var taskConfig = {

        pkg: grunt.file.readJSON('package.json'),

		watch: {

            // compass: {
            //     files: '<%= app_files.scss %>',
            //     tasks: [ 'compass', 'clean:sass' ]
            // },

            src: {
                files: [
                    '<%= app_files.js %>',
                    '<%= app_files.html %>',
                    '<%= app_files.atpl %>'
                ],
                options: {
                    livereload: true
                    // nospawn: true
                },
                tasks: [
                    'copy',
                    'index:build'
                ]
            },
            bin: {
				files: [ 'bin/**' ],
				options: {
                    livereload: 1337
					// nospawn: true
				}
            }
        },

        open: {
            server: {
                url: 'http://localhost:9001'
            }
        },

        clean: {
            precompile: [
                '.sass-cache',
                '<%= precompile_dir %>'
            ],
            all: [
                '.sass-cache',
                '<%= build_dir %>', 
                '<%= precompile_dir %>'
            ]
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= app_files.js %>'
            ],
            gruntfile: [
                'Gruntfile.js'
            ]
        },

        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        },

        compass: {
            build: {
                options: {
                    sassDir: 'src/main/style',
                    cssDir: '<%= precompile_dir %>/assets/css',
                    // imagesDir: '<%= config.app %>/img',
                    javascriptsDir: 'src/main/js',
                    // fontsDir: '/fonts',
                    importPath: ['src/vendor/compass-twitter-bootstrap/stylesheets'],
                    relativeAssets: true
                }
            }
        },

        copy: {
            assets: {
                files: [
                    { 
                        src: [ '**' ],
                        dest: '<%= build_dir %>/',
                        cwd: 'build/',
                        expand: true
                    }
                ]   
            },

            vendorjs: {
                files: [
                    {
                        src: [ '**/*.js', '!**/*min.js'],
                        dest: '<%= build_dir %>/vendor/js',
                        cwd: 'src/vendor/angular/',
                        expand: true
                    }
                ]
            },
            
            appjs: {
                files: [
                    {
                        src: [ '**/*.js' ],
                        dest: '<%= build_dir %>/js',
                        cwd: 'src/main/js/',
                        expand: true
                    }
                ]
            },

            views: {
                files: [
                    {
                        src: [ '**/*.html' ],
                        dest: '<%= build_dir %>/view',
                        cwd: 'src/main/view/',
                        expand: true
                    }
                ]
            }
        },

        index: {
            /**
             * During development, we don't want to have wait for compilation,
             * concatenation, minification, etc. So to avoid these steps, we simply
             * add all script files directly to the `<head>` of `index.html`. The
             * `src` property contains the list of included files.
             */
            build: {
                dir: '<%= build_dir %>',
                src: [
                    '<%= build_dir %>/vendor/**/*.js',
                    '<%= build_dir %>/js/**/*.js',
                    // '<%= html2js.common.dest %>',
                    // '<%= html2js.app.dest %>',
                    // '<%= vendor_files.css %>'
                    '<%= build_dir %>/assets/css/**/*.css'
                ]
            }
        }

        // docco: {
        //     src: {
        //         src: ['<%= config.app %>/**/*.js',
        //         'Gruntfile.js',
        //         '!<%= config.app %>/vendor/**/*.js'],
        //         options: {
        //             output: 'docs/',
        //             layout: 'classic'
        //         }
        //     }
        // }

	};

    grunt.initConfig( grunt.util._.extend( taskConfig, userConfig ) );

    /**
     * A utility function to get all app JavaScript sources.
     */
    function filterForJS ( files ) {
        return files.filter( function ( file ) {
            return file.match( /\.js$/ );
        });
    }

    /**
     * A utility function to get all app CSS sources.
     */
    function filterForCSS ( files ) {
        return files.filter( function ( file ) {
            return file.match( /\.css$/ );
        });
    }

    /** 
     * The index.html template includes the stylesheet and javascript sources
     * based on dynamic names calculated in this Gruntfile. This task assembles
     * the list into variables for the template to use and then runs the
     * compilation.
     */
    grunt.registerMultiTask('index', 'Process index.html template', function () {
        var dirRE = new RegExp( '^('+grunt.config('build_dir')+'|'+grunt.config('precompile_dir')+')\/', 'g' );
        var jsFiles = filterForJS( this.filesSrc ).map( function ( file ) {
            grunt.log.write(file + '\n');
            return file.replace( dirRE, '' );
        });
        var cssFiles = filterForCSS( this.filesSrc ).map( function ( file ) {
            return file.replace( dirRE, '' );
        });
        // grunt.log.write(jsFiles);
        grunt.file.copy('src/index.html', 'bin' + '/index.html', { 
            process: function ( contents, path ) {
                return grunt.template.process( contents, {
                    data: {
                        scripts: jsFiles,
                        styles: cssFiles,
                        version: grunt.config( 'pkg.version' )
                    }
                });
            }
        });
    });

    grunt.registerTask('precompile_dir', function() {
		grunt.file.mkdir('build');
		grunt.file.mkdir('bin');
    });

    //
    //
    //

    grunt.registerTask('close', function() {
		if (app) {
            console.log('closing express app........');
			app.close();
		}
    });

    var app;
    grunt.registerTask('connect', 'Static express server with routing proxy', function() {

        var express = require('express');
        app			= express();

        var allowCrossDomain = function(req, res, next) {

            console.log('[express-proxy] -', req.method, req.url);

            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header(
                'Access-Control-Allow-Headers',
                'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization'
            );

            // intercept OPTIONS method
            if ('OPTIONS' == req.method) {
                console.log('[express-proxy] handle pre-flight');
                res.send(200);
            }
            else {
                next();
            }
        };

        app.configure(function() {
            /* global __dirname */
            app.use(allowCrossDomain);
            app.use(express.static(__dirname + '/bin'));
        });

        app.listen(9001);

    });

    grunt.registerTask('default', ['build']);
	grunt.registerTask('build', [
		'close',
		'clean',
		'jshint',
		// 'karma',
        'precompile_dir',
		'compass:build',
        'copy',
        'clean:precompile',
        'index:build',
        'connect:build',
		'open',
		'watch:src'
	]);

	grunt.registerTask('quick', [
		'close',
		'jshint',
		'copy',
		'index:build',
		'connect:build',
		'open',
		'watch'
	]);

	grunt.registerTask('test', [
		'clean',
		'jshint',
		'karma'
	]);
};
