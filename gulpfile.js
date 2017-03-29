const gulp = require('gulp');
const requireDir = require('require-dir');
var runSequence = require('run-sequence');

requireDir('./gulp/tasks', {recurse: true});

gulp.task('default', function(callback) {
  // runSequence('zip', 'deploy', 'cleanup', callback);
  runSequence('publish', callback);
});
