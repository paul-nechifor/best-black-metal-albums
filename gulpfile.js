var async = require('async');
var fs = require('fs');
var gulp = require('gulp');
var path = require('path');
var pug = require('gulp-pug');
var request = require('throttled-request')(require('request'));
var stylus = require('gulp-stylus');
var webserver = require('gulp-webserver');
var gm = require('gm').subClass({imageMagick: true});
var stringToStream = require('string-to-stream');

request.configure({requests: 5, milliseconds: 1000});

var albumSize = 150;

gulp.task('default', ['build', 'webserver', 'watch']);

gulp.task('build', ['html', 'style', 'title']);

gulp.task('watch', function () {
    gulp.watch('index.pug', ['html']);
    gulp.watch('style.styl', ['style']);
});

gulp.task('html', function () {
  return gulp.src('index.pug')
  .pipe(pug({locals: {
    title: 'Best Black Metal Albums',
    albums: getAlbums(),
  }}))
  .pipe(gulp.dest('build'));
});

gulp.task('style', function () {
  return gulp.src('style.styl')
  .pipe(stylus({compress: true}))
  .pipe(gulp.dest('build'));
});

gulp.task('title', function () {
  gulp.src('title.png').pipe(gulp.dest('build'));
});

gulp.task('webserver', function () {
  gulp.src('build')
  .pipe(webserver({livereload: true, open: true, port:8080, host: '0.0.0.0'}));
});

gulp.task('get-covers', function (cb) {
  async.map(getAlbums(), getAlbumCover, cb);
});

function getAlbums() {
  return JSON.parse(fs.readFileSync(
    path.resolve(__dirname, 'albums.json'), 'utf8'
  )).map(function (x) {
    x.id = getImageId(x.cover);
    return x;
  });
}

function getAlbumCover(album, cb) {
  request(album.cover, {encoding: null}, function (err, res, data) {
    if (err) {
      return cb(err);
    }
    var imagePath = path.resolve(
      __dirname, 'build', 'covers', album.id + '.jpg'
    );
    gm(stringToStream(data), album.id + '.jpg')
    .resize(albumSize, albumSize)
    .modulate(100, 0)
    .write(imagePath, cb);
  });
}

function getImageId(cover) {
  var parts = cover.split('/');
  return parts[parts.length - 1].split('.')[0];
}
