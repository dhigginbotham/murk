var gulp = require('gulp'),
    guglify = require('gulp-uglify'),
    ggzip = require('gulp-gzip'),
    gpages = require('gulp-gh-pages'),
    gutil = require('gulp-util'),
    gconcat = require('gulp-concat'),
    gtemplate = require('gulp-template'),
    grename = require('gulp-rename'),
    fs = require('fs');



gulp.task('min', function() {
  return gulp.src('./src/murk.js')
    .on('error', gutil.log)
    .pipe(gulp.dest('./examples/js'))
    .pipe(guglify())
    .pipe(gulp.dest('./dist'));
});

gulp.task('zip', function() {
  return gulp.src('./dist/murk.js')
    .on('error', gutil.log)
    .pipe(ggzip())
    .pipe(gulp.dest('./dist'));
});

gulp.task('examples', function() {
  return gulp.src([
      './examples/build/js/example.js',
      './examples/build/js/basic-example.js',
      './examples/build/js/repeat-example.js'
    ])
    .on('error', gutil.log)
    .pipe(gconcat('examples.min.js'))
    .pipe(guglify())
    .pipe(gulp.dest('./examples/js'));
});

gulp.task('template', ['examples'], function() {
  var templateFiles = { 
    basicJs: fs.readFileSync('./examples/build/js/basic-example.js'),
    repeatJs: fs.readFileSync('./examples/build/js/repeat-example.js'),
    basicTmpl: fs.readFileSync('./examples/build/templates/basic-example.tmpl'),
    repeatTmpl: fs.readFileSync('./examples/build/templates/repeat-example.tmpl')
  };
  return gulp.src('./examples/build/templates/layout.tmpl')
    .on('error', gutil.log)
    .pipe(gtemplate(templateFiles))
    .pipe(grename('./index.html'))
    .pipe(gulp.dest('./examples'));
});

gulp.task('gh', function() {
  return gulp.src('./examples/**/*')
    .pipe(gpages());
});

gulp.task('watch', function() {
  gulp.watch(['./src/**/*','./examples/**/*'], ['min', 'zip', 'template']);
});

gulp.task('default', ['min', 'zip', 'watch']);