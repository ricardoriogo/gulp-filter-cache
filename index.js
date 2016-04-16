'use strict';

var fs      = require('fs');
var path    = require('path');
var gutil   = require('gulp-util');
var crypto  = require('crypto');
var through = require('through2');
var extend  = require('deep-extend');

var filterCache = function(options) {

  var options = options || {};
  var _cacheFile = options.cacheFile || path.normalize(__dirname + '/../.filter-cache');
  var _method = typeof options.method != 'undefined' && options.method == 'hash' 
    ? 'hash' 
    : 'time';
  var _confirmToSave = typeof options.confirmToSave != 'undefined' && options.confirmToSave 
    ? true 
    : false;
  var _onlyFiles = typeof options.onlyFiles != 'undefined' && options.onlyFiles 
    ? true 
    : false;
  var _oldCache;
  var _newCache = {};
  var _countNew = 0;
  var _countModified = 0;

  try {
    _oldCache = JSON.parse(fs.readFileSync(_cacheFile, 'utf8'));
  } catch (err) {
    _oldCache = {};
  }

  function checkFile(file) {
    if(! file.isBuffer()) return false;

    var filepath = cleanPath(file);
    var filename = path.basename(file.path);

    if (typeof _oldCache[filepath] == 'undefined') _oldCache[filepath] = {};
    if (typeof _newCache[filepath] == 'undefined') _newCache[filepath] = {};

    var cache = typeof _oldCache[filepath][filename] != 'undefined' 
      ? _oldCache[filepath][filename] 
      : false;
    
    if (_method == 'time') {
      var stat = file.stat && file.stat.mtime.getTime();
    } else {
      var stat = hash(file.contents.toString());
    }

    // filter matching files
    if (cache && stat && cache === stat) return false;
    
    if (stat) _newCache[filepath][filename] = stat;
    
    return true;
  }

  function saveFile(file) {
    if(! file.isBuffer()) return false;

    var filepath = cleanPath(file);
    var filename = path.basename(file.path);

    var cache = typeof _newCache[filepath][filename] != 'undefined' 
      ? _newCache[filepath][filename] 
      : false;
    
    _oldCache[filepath][filename] = cache;
    
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
    if(! _confirmToSave) {
      _oldCache = getAllCache();
      fs.writeFile(_cacheFile, JSON.stringify(_oldCache), callback);
    } else {
      callback();
    }
  }

  function saveStream(file, enc, callback){
    if (file.isNull()) {
      callback(null, (_onlyFiles ? null : file));
      return;
    }

    if (file.isStream()) {
      callback(new gutil.PluginError('gulp-filter-cache', 'Streaming not supported'));
      return;
    }
    
    if(saveFile(file)) this.push(file);
    return callback();
  }

  function saveFlush(callback){
    fs.writeFile(_cacheFile, JSON.stringify(_oldCache), callback);
  }

  function saveCache() {
    return through.obj(saveStream, saveFlush);
  }
  
  function getAllCache() {
    return extend(_oldCache, _newCache);
  }
  
  function replaceAll(str, search, replacement) {
    return str.split(search).join(replacement);
  }
  
  function cleanPath(file){
    var filepath = path.dirname(path.normalize(file.path));
    
    if(filepath.search(new RegExp(replaceAll(path.normalize(file.cwd), '\\', '\\\\'))) === 0)
      filepath = filepath.replace(file.cwd, '');
      
    if(filepath.search(new RegExp(replaceAll(path.normalize(file.base), '\\', '\\\\'))) === 0)
      filepath = filepath.replace(file.base, '');
      
    return filepath;
  }

  var ret = through.obj(filter, flush);

  // For tests proposes
  ret.instance = {
    cache: getAllCache,
    newCache: _newCache,
    oldCache: _oldCache
  };
  
  ret.saveCache = saveCache;

  return ret;
};

module.exports = function(options){
  return new filterCache(options);
};