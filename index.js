'use strict';
var fs      = require('fs');
var path    = require('path');
var gutil   = require('gulp-util');
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

// Check file
// Return callback or save to cache and add to stream

FilterCache.prototype.checkFile = function(file) {
  var _this = this;

  if(! file.isBuffer()) return false;

  var filepath = path.dirname(file.path),
	  filename = path.basename(file.path);

	  if(typeof _this._cache[filepath] == 'undefined') _this._cache[filepath] = {};

  var cache = _this._cache[filepath][filename],
      stat = file.stat && file.stat.mtime.getTime();

  // filter matching files
  if (cache && stat && cache === stat) return false;
  
  if (file.path && stat) this._cache[filepath][filename] = stat;
  
  return true;
};

FilterCache.prototype.filter = function() {
  var _this = this;

  // update cache
  function transform(file, enc, callback) {
  	if (file.isNull()) {
		callback(null, file);
		return;
	}

	if (file.isStream()) {
		callback(new gutil.PluginError('gulp-filter-cache', 'Streaming not supported'));
		return;
	}

    if(_this.checkFile(file)) this.push(file);
    
    return callback();
  }

  // flush cache to disk
  function flush(callback) {
    fs.writeFile(_this._cacheFile, JSON.stringify(_this._cache), callback);
  }

  return through.obj(transform, flush);
};

module.exports = function(options){
	return new FilterCache(options);
};

/*module.exports = function (options) {
	if (!options.foo) {
		throw new gutil.PluginError('gulp-filter-cache', '`foo` required');
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-filter-cache', 'Streaming not supported'));
			return;
		}

		try {
			file.contents = new Buffer(someModule(file.contents.toString(), options));
			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-filter-cache', err));
		}

		cb();
	});
};*/
