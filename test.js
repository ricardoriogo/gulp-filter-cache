'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var chai = require('chai');
var crypto = require('crypto');
var filterCache = require('./');

var expect = chai.expect;

describe('gulp-filter-cache', function(){
  var filterCacheHash = filterCache({
    cacheFile: './.filter-cache1'
  });
  
  var filterCacheMtime = filterCache({
    method:'time',
    cacheFile: './.filter-cache2'
  });
  
  var d1 = new Date('2016-01-01'),
  d2 = new Date('2016-02-01'),
  d3 = new Date('2016-03-01'),
  file1, file2, file3;

  file1 = new gutil.File({
    path: 'path/file1',
    stat: {mtime: d1},
    contents: new Buffer('The file contents')
  });
  
  file2 = new gutil.File({
    path: 'path/file2',
    stat: {mtime: d2},
    contents: new Buffer('The file contents2')
  });
  
  file3 = new gutil.File({
    path: 'path/file3',
    stat: {mtime: d3},
    contents: new Buffer('The file contents3')
  });
  
  it('Should populate the cache using hash', function (done) {
    var stream = filterCacheHash.filter();
    
    stream.on('finish', function() {
      expect(filterCacheHash._cache['path']).to.have.keys(['file1', 'file2', 'file3']);
      assert.strictEqual(filterCacheHash._cache['path']['file1'], '9d4b55435f3d1411d6db22f0a9741de3');
      done();
    });
    
    stream.write(file1);
    stream.write(file2);
    stream.write(file3);
    stream.end();
  });
  
  it('Should populate the cache using mtime', function (done) {
    var stream = filterCacheMtime.filter();
    
    stream.on('finish', function() {
      expect(filterCacheMtime._cache['path']).to.have.keys(['file1', 'file2', 'file3']);
      assert.strictEqual(filterCacheMtime._cache['path']['file1'], 1451606400000);
      done();
    });
    
    stream.write(file1);
    stream.write(file2);
    stream.write(file3);
    stream.end();
  });
});
