'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var chai = require('chai');
var filterCache = require('./');

var expect = chai.expect;

describe('gulp-filter-cache', function(){
	var fileCache = filterCache(),
      d1 = new Date('2014-01-01'),
      d2 = new Date('2014-02-01'),
      file1, file2, file3;

	file1 = new gutil.File({
		path: 'path/file1',
		stat: {mtime: d1}
	});
	
	file2 = new gutil.File({
		path: 'path/file2',
		stat: {mtime: d1}
	});
	
	file3 = new gutil.File({
		path: 'path/file3',
		stat: {mtime: d1}
	});
	
	it('should populate the cache', function (done) {
		var stream = filterCache().filter();
		
		stream.on('finish', function() {
			expect(fileCache._cache['path']).to.have.keys(['file1', 'file2']);
			done();
		});
		
		stream.write(file1);
		stream.write(file2);
		stream.end();
	});
	

	it('should ', function (cb) {
		//var filter = new filterCache('oi');
		//var stream = filter.cache();
		
		var stream = filterCache('oi').filter();
	
		stream.on('data', function (file) {
			assert.strictEqual(file.contents.toString(), 'unicorns');
		});
	
		stream.on('end', cb);
	
		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/file.ext',
			contents: new Buffer('unicorns')
		}));
	
		stream.end();
	});
})
