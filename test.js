'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var chai = require('chai');
var crypto = require('crypto');
var filterCache = require('./');
var fs = require('fs');

var expect = chai.expect;

describe('gulp-filter-cache', function(){
  var filterCacheHash = filterCache({
    method:'hash',
    cacheFile: './.filter-cache1'
  });
  
  var filterCacheHashSecondCall;
  
  var filterCacheMtime = filterCache({
    method:'time',
    cacheFile: './.filter-cache2'
  });
  
  var filterCacheSave = filterCache({
    cacheFile: './.filter-cache3',
    confirmToSave: true
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
    var cache = filterCacheHash.instance.cache();
    
    filterCacheHash.on('finish', function() {
      expect(cache['path']).to.have.keys(['file1', 'file2', 'file3']);
      assert.strictEqual(cache['path']['file1'], '9d4b55435f3d1411d6db22f0a9741de3');
      done();
    });
    
    filterCacheHash.write(file1);
    filterCacheHash.write(file2);
    filterCacheHash.write(file3);
    filterCacheHash.end();
  });
  
  it('Should populate the cache using mtime', function (done) {
    var cache = filterCacheMtime.instance.cache();
    
    filterCacheMtime.on('finish', function() {
      expect(cache['path']).to.have.keys(['file1', 'file2', 'file3']);
      assert.strictEqual(cache['path']['file1'], 1451606400000);
      done();
    });
    
    filterCacheMtime.write(file1);
    filterCacheMtime.write(file2);
    filterCacheMtime.write(file3);
    filterCacheMtime.end();
  });
  
  it('Should have keys of a previous call', function (done) {
    filterCacheHashSecondCall = filterCache({
      method:'hash',
      cacheFile: './.filter-cache'
    });
    
    filterCacheHashSecondCall.end();
    
    expect(filterCacheHashSecondCall.instance.oldCache['path']).to.have.keys(['file1', 'file2', 'file3']);
    assert.strictEqual(filterCacheHashSecondCall.instance.oldCache['path']['file1'], '9d4b55435f3d1411d6db22f0a9741de3');
    
    done();
  });
  
  it('Should populate the cache using saveCache()', function (done) {
    var cache = filterCacheSave.instance.cache;
    
    filterCacheSave.on('finish', function() {
      expect(filterCacheSave.instance.oldCache['path']).to.not.have.keys(['file1', 'file2', 'file3']);
      expect(filterCacheSave.instance.newCache['path']).to.have.keys(['file1', 'file2', 'file3']);
      
      var saving = filterCacheSave.saveCache();
      
      saving.on('finish', function() {
        expect(filterCacheSave.instance.oldCache['path']).to.have.keys(['file2', 'file3']);
        expect(filterCacheSave.instance.newCache['path']).to.have.keys(['file1', 'file2', 'file3']);
        expect(cache()['path']).to.have.keys(['file1', 'file2', 'file3']);
        
        assert.strictEqual(filterCacheSave.instance.cache()['path']['file1'], 1451606400000);
        done();
      });
      
      saving.write(file2);
      saving.write(file3);
      saving.end();
      
      fs.unlink('./.filter-cache1');
      fs.unlink('./.filter-cache2');
      fs.unlink('./.filter-cache3');
      
    });
    
    filterCacheSave.write(file1);
    filterCacheSave.write(file2);
    filterCacheSave.write(file3);
    filterCacheSave.end();
  });
});
