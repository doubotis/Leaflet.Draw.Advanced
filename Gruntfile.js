/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
module.exports = function (grunt) {
    // Project configuration.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    
    grunt.initConfig({
        uglify: {
            build: {
                files: {
                    'dist/leafletjs.editor.min.js': ['src/L.SmartEditor.js','src/objects/*.js','src/routing/*.js','src/draw/*.js']
                }
            }
        },
        copy: {
            build: {
                expand: true, cwd: 'src/images/', src: ['**'], dest: 'dist/images'
            }
        },
        clean: ['dist/leafletjs.editor.min.js', 'dist/images/**']
    });
    grunt.registerTask('build', ['uglify:build', 'copy:build']);
};
