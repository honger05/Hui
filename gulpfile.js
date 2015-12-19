
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
										'src/ui/confirmbox.js',

										// switchable ui
										'src/ui/switchable/plugins/easing.js',
										'src/ui/switchable/plugins/effects.js',
										'src/ui/switchable/plugins/autoplay.js',
										'src/ui/switchable/plugins/circular.js',
										'src/ui/switchable/switchable.js',
										'src/ui/switchable/tabs.js',
										'src/ui/switchable/slide.js',
										'src/ui/switchable/carousel.js',
										'src/ui/switchable/accordion.js',

										// validator
										'src/ui/validator/async.js',
										'src/ui/validator/rule.js',
										'src/ui/validator/utils.js',
										'src/ui/validator/item.js',
										'src/ui/validator/core.js',
										'src/ui/validator/validator.js',

										// qrcode
										// 'src/utility/qrcode/qrcodealg.js',
										// 'src/utility/qrcode/index.js',

										// autocomplete
										'src/ui/autocomplete/input.js',
										'src/ui/autocomplete/filter.js',
										'src/ui/autocomplete/data-source.js',
										'src/ui/autocomplete/autocomplete.js',

										// calendar
										'src/ui/calendar/i18n/en.js',
										'src/ui/calendar/i18n/fr.js',
										'src/ui/calendar/i18n/ja.js',
										'src/ui/calendar/i18n/zh-cn.js',
										'src/ui/calendar/i18n/zh-tw.js',
										'src/ui/calendar/base-calendar.js',
										'src/ui/calendar/base-column.js',
										'src/ui/calendar/calendar-tpl.js',
										'src/ui/calendar/date-column.js',
										'src/ui/calendar/month-column.js',
										'src/ui/calendar/year-column.js',
										'src/ui/calendar/double-calendar.js',
										'src/ui/calendar/calendar.js'

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

gulp.task('examples', ['base'], function() {
	return gulp.src('dist/**/*.*')
					   .pipe(gulp.dest('examples/content/dist/'))
})

gulp.task('base', ['uglify-core', 'uglify-ui', 'asset', 'lib']);

gulp.task('default', ['examples']);



