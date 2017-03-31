const gulp = require('gulp');
const config = require('../config').notify;
const slack = require('gulp-slack')(config.slack);
const manifest = require('../../manifest.json');

var chromelink = 'https://chrome.google.com/webstore/detail/nius-litte-helper/fdldehahkijcfpmjhgnkggopliakcknj?hl=de';

gulp.task('notify', () =>
  gulp.src('').pipe(
    slack(
      'Deployed latest build ' + manifest.version + ' to <' + chromelink + '|Chrome Web Store>.')
  )
);
