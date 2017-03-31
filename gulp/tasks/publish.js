var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('publish', function(callback) {
  runSequence('zip', 'deploy', 'cleanup', 'notify', callback);
});
