
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('core', function() {
	return gulp.src([
										'src/core/class.js',
										'src/core/events.js',
										'src/core/aspect.js',
										'src/core/attribute.js',
										'src/core/base.js',
										'src/core/auto-render.js',
										'src/core/daparser.js',
										'src/core/widget.js'
								  ])
						  .pipe(concat('core-debug.js'))
						  .pipe(gulp.dest('dist/'))
})

gulp.task('uglify-core', ['core'], function() {
	return gulp.src('dist/core-debug.js')
						 .pipe(uglify())
						 .pipe(rename('core.js'))
						 .pipe(gulp.dest('dist/'))
})

gulp.task('ui', function() {
	return gulp.src([ 
										'src/utility/position.js',
										'src/utility/iframe-shim.js',
										'src/utility/messenger.js',
										'src/utility/templatable.js',
										'src/ui/overlay.js',
										'src/ui/mask.js',
										'src/ui/popup.js',
										'src/ui/dialog.js',
										'src/ui/confirmbox.js'
									])
						 .pipe(concat('hui-debug.js'))
						 .pipe(gulp.dest('dist/'))
})

gulp.task('uglify-ui', ['ui'], function() {
	return gulp.src('dist/hui-debug.js')
						 .pipe(uglify())
						 .pipe(rename('hui.js'))
						 .pipe(gulp.dest('dist/'))
})

gulp.task('asset', function() {
	return gulp.src('src/asset/**/*.*')
						 .pipe(gulp.dest('dist/asset'))
})

gulp.task('lib', function() {
	return gulp.src('src/lib/**/*.*')
						 .pipe(gulp.dest('dist/lib'))
})


gulp.task('default', ['uglify-core', 'uglify-ui', 'asset', 'lib']);