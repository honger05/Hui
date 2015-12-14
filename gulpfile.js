
var gulp = require('gulp');
var webpack = require('webpack');

gulp.task('webpack', function() {
	gulp.src('src/core/*.js')
			.pipe(webpack())
			.pipe(gulp.dest('dist/'))
})


gulp.task('default', ['webpack']);