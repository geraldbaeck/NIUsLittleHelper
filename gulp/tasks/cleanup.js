const gulp = require('gulp');
const clean = require('gulp-clean');

const config = require('../config').deploy;

gulp.task('cleanup', function () {
  return gulp.src('release', {read: false}).pipe(clean());
});
