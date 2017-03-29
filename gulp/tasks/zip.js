const gulp = require('gulp');
const zip = require('gulp-zip');

const config = require('../config').deploy;

gulp.task('zip', () =>
    gulp.src(config.packItems, {base: '../'})
        .pipe(zip(config.packageName))
        .pipe(gulp.dest('release'))
);
