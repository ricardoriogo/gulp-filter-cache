'use strict';
var fs      = require('fs');
var path    = require('path');
var gutil   = require('gulp-util');
var crypto  = require('crypto');
var through = require('through2');

function FilterCache(options){
  var options = options || {};
  this._cacheFile = options.cacheFile || path.normalize(__dirname + '/../.filter-cache');
  this._method = typeof options.method != 'undefined' && options.method == 'time' ? 'time' : 'hash';

  try {
    this._cache = JSON.parse(fs.readFileSync(this._cacheFile, 'utf8'));
  } catch (err) {
    this._cache = {};
  }
};

FilterCache.prototype.checkFile = function(file) {
  var _this = this;

  if(! file.isBuffer()) return false;

  var filepath = path.dirname(file.path),
  filename = path.basename(file.path);

  if(typeof _this._cache[filepath] == 'undefined') _this._cache[filepath] = {};

  var cache = typeof _this._cache[filepath][filename] != 'undefined' ? _this._cache[filepath][filename] : false;
  
  if(_this._method == 'time'){
    var stat = file.stat && file.stat.mtime.getTime();
  } else {
    var stat = _this.hash(file.contents.toString());
  }

  // filter matching files
  if (cache && stat && cache === stat) return false;
  
  if (stat) _this._cache[filepath][filename] = stat;
  
  return true;
};

FilterCache.prototype.hash = function(content){
  var hash = crypto.createHash('md5');
  hash.update(content);
  return hash.digest('hex');
};

FilterCache.prototype.filter = function() {
  var _this = this;

  function filter(file, enc, callback) {
    if (file.isNull()) {
      callback();
      return;
    }

    if (file.isStream()) {
      callback(new gutil.PluginError('gulp-filter-cache', 'Streaming not supported'));
      return;
    }

    if(_this.checkFile(file)) this.push(file);

    return callback();
  }

  function flush(callback) {
    fs.writeFile(_this._cacheFile, JSON.stringify(_this._cache), callback);
  }

  return through.obj(filter, flush);
};

module.exports = function(options){
	return new FilterCache(options);
};
