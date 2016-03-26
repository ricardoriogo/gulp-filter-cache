'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var chai = require('chai');
var crypto = require('crypto');
var filterCache = require('./');

var expect = chai.expect;

describe('gulp-filter-cache', function(){
  var filterCacheHash = filterCache({
    method:'hash',
    cacheFile: './.filter-cache1'
  });
  
  var filterCacheMtime = filterCache({
    method:'time',
    cacheFile: './.filter-cache2'
  });
  
  var d1 = new Date('2016-01-01');
  var d2 = new Date('2016-02-01');
  var d3 = new Date('2016-03-01');

  var file1 = new gutil.File({
    path: 'path/file1',
    stat: {mtime: d1},
    contents: new Buffer('The file contents')
  });
  
  var file2 = new gutil.File({
    path: 'path/file2',
    stat: {mtime: d2},
    contents: new Buffer('The file contents2')
  });
  
  var file3 = new gutil.File({
    path: 'path/file3',
    stat: {mtime: d3},
    contents: new Buffer('The file contents3')
  });
  
  it('Should populate the cache using hash', function (done) {
    var instance = filterCacheHash.instance;
    
    filterCacheHash.on('finish', function() {
      expect(instance['cache']['path']).to.have.keys(['file1', 'file2', 'file3']);
      assert.strictEqual(instance['cache']['path']['file1'], '9d4b55435f3d1411d6db22f0a9741de3');
      done();
    });
    
    filterCacheHash.write(file1);
    filterCacheHash.write(file2);
    filterCacheHash.write(file3);
    filterCacheHash.end();
  });
  
  it('Should populate the cache using mtime', function (done) {
    var instance = filterCacheMtime.instance;
    
    filterCacheMtime.on('finish', function() {
      expect(instance.cache['path']).to.have.keys(['file1', 'file2', 'file3']);
      assert.strictEqual(instance.cache['path']['file1'], 1451606400000);
      done();
    });
    
    filterCacheMtime.write(file1);
    filterCacheMtime.write(file2);
    filterCacheMtime.write(file3);
    filterCacheMtime.end();
  });
});
