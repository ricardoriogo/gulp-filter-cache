'use strict';
var fs      = require('fs');
var path    = require('path');
var gutil   = require('gulp-util');
var crypto  = require('crypto');
var through = require('through2');

module.exports = function(options) {

  var options = options || {};
  var _cacheFile = options.cacheFile || path.normalize(__dirname + '/../.filter-cache');
  var _method = typeof options.method != 'undefined' && options.method == 'hash' 
    ? 'hash' 
    : 'time';
  var _onlyFiles = typeof options.onlyFiles != 'undefined' && options.onlyFiles 
    ? true 
    : false;
  var _cache;
  var _countNew = 0;
  var _countModified = 0;

  try {
    _cache = JSON.parse(fs.readFileSync(_cacheFile, 'utf8'));
  } catch (err) {
    _cache = {};
  }

  function checkFile(file) {
    if(! file.isBuffer()) return false;

    var filepath = path.dirname(file.path);
    var filename = path.basename(file.path);

    if (typeof _cache[filepath] == 'undefined') _cache[filepath] = {};

    var cache = typeof _cache[filepath][filename] != 'undefined' 
      ? _cache[filepath][filename] 
      : false;
    
    if (_method == 'time') {
      var stat = file.stat && file.stat.mtime.getTime();
    } else {
      var stat = hash(file.contents.toString());
    }

    // filter matching files
    if (cache && stat && cache === stat) return false;
    
    if (stat) _cache[filepath][filename] = stat;
    
    return true;
  }

  function hash(content){
    var hash = crypto.createHash('md5');
    hash.update(content);
    return hash.digest('hex');
  }

  function filter(file, enc, callback) {
    if (file.isNull()) {
      callback(null, (_onlyFiles ? null : file));
      return;
    }

    if (file.isStream()) {
      callback(new gutil.PluginError('gulp-filter-cache', 'Streaming not supported'));
      return;
    }

    if(checkFile(file)) this.push(file);

    return callback();
  }

  function flush(callback) {
    fs.writeFile(_cacheFile, JSON.stringify(_cache), callback);
  }

  var ret = through.obj(filter, flush);

  // For tests, it exposes the _cache variable
  ret.instance = {
    cache: _cache
  };

  return ret;
};
