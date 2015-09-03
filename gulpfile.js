var gulp = require('gulp'),
    guglify = require('gulp-uglify'),
    ggzip = require('gulp-gzip'),
    gpages = require('gulp-gh-pages'),
    gutil = require('gulp-util'),
    gtemplate = require('gulp-template'),
    grename = require('gulp-rename'),
    fs = require('fs');

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
    .pipe(gulp.dest('./dist'));
});

gulp.task('template', function() {
  var example = fs.readFileSync('./examples/js/example.js');
  return gulp.src('./examples/template.tmpl')
    .pipe(gtemplate({ js: example }))
    .pipe(grename('./examples/index.html'))
    .pipe(gulp.dest('./examples'));
});

gulp.task('gh', function() {
  return gulp.src('./examples/**/*')
    .pipe(gpages());
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*', ['min', 'zip']);
});

gulp.task('default', ['min', 'zip', 'watch']);