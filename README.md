# gulp-filter-cache [![Build Status](https://travis-ci.org/ricardoriogo/gulp-filter-cache.svg?branch=master)](https://travis-ci.org/ricardoriogo/gulp-filter-cache)

> **gulp-filter-cache** creates a local cache file to keep simple and fast to use only new or modified files. 

I made this plugin especially to use with **vinyl-ftp**.  
Vinyl-ftp can check for new or modified files using date/time of remote files. It used to be a slow process in shared hosts or using a lot of files. Using gulp-file-cache, the files will be checked locally and after vinyl-ftp upload them.


## Install

```
$ npm install --save-dev gulp-filter-cache
```


## Usage

```js
var gulp = require('gulp');
var fileCache = require('gulp-filter-cache');
var ftp = require('vinyl-ftp');

gulp.task('ftp-deploy', function () {
    
    var conn = ftp.create({
        host:     'mywebsite.tld',
        user:     'me',
        password: 'mypass',
    });

    return gulp.src('public/**/*')
        .pipe(fileCache())
        .pipe(conn.dest('/remote-folder'));
});
```


## API

### gulp-file-cache(options)

#### options

##### cacheFile

Type: `string`  
Default: `./node_modules/.filter-cache`

Cache File path. By default the file is created in `node_modules` folder. You can change it defining a new file path in **cacheFile** option.


##### method

Type: `string`  
Default: `time`

The **gulp-filter-cache** can use two method of file comparition.

 * `time` uses modification time of file
 * `hash` uses md5 hash signature of file


##### onlyFiles

Type: `bool`  
Default: `false`

Set it to `true` if you don't want to use folders on your stream. All empty folders will be ignored by filter.



## License

MIT © Ricardo Riogo (ricardoriogo.com)
