var gulp = require('gulp'),
    guglify = require('gulp-uglify'),
    ggzip = require('gulp-gzip'),
    gpages = require('gulp-gh-pages'),
    gutil = require('gulp-util');

gulp.task('min', function() {
  return gulp.src('./src/murk.js')
    .on('error', gutil.log)
    .pipe(guglify())
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./examples/js'));
});

gulp.task('zip', function() {
  return gulp.src('./dist/murk.js')
    .on('error', gutil.log)
    .pipe(ggzip())
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./examples/js'));
});

gulp.task('gh', function() {
  return gulp.src('./examples/**/*')
    .pipe(gpages());
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*', ['min', 'zip']);
});

gulp.task('default', ['min', 'zip', 'watch']);