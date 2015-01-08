'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: ".jshintrc"
            },
            files: ['Gruntfile.js', 'src/**/*.js']
        },
        testem: {
            unit: {
                options: {
                    framework: "jasmine2",
                    before_tests: "grunt jshint",
                    launch_in_dev: ["PhantomJS"],
                    src: [
                        'bower_components/lodash/dist/lodash.js',
                        'bower_components/jquery/dist/jquery.js',
                        'src/**/*.js',
                        'test/*.js',
                        'test/**/*.js'
                    ],
                    watch_files: [
                        'src/**/*.js',
                        'test/**/*.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-testem');

    grunt.registerTask('default', ['testem:run:unit']);
};