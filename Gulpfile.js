var path = require('path');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var instanbul = require('gulp-istanbul');
var coveralls = require('gulp-coveralls');

gulp.task('lint', function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', ['lint'], function(done) {
  gulp.src('src/**/__tests__/*.js', {read: false})
    .pipe(mocha({reporter: 'spec'}))
    .pipe(instanbul.writeReports())
    .on('end', done);
});

gulp.task('submit-coverage', function() {
  return gulp.src('coverage/lcov.info')
    .pipe(coveralls());
});

gulp.task('watch', function() {
  gulp.watch('src/**/*', ['test']);
});

gulp.task('default', ['test']);
