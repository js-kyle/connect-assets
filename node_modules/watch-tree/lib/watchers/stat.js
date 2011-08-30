(function() {
  var ENOENT, ENOTDIR, Paths, StatWatcher, assert, async, events, fs, pathsIn, _pathsIn;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  fs = require('fs');
  events = require('events');
  assert = require('assert');
  async = require('async');
  ENOENT = 2;
  ENOTDIR = 20;
  Paths = (function() {
    function Paths() {
      this.items = [];
      this.itemsDict = {};
      this.numItems = 0;
      this.pos = 0;
    }
    Paths.prototype.add = function(x) {
      assert.ok(!this.contains(x));
      this.items.push(x);
      this.numItems += 1;
      return this.itemsDict[x] = true;
    };
    Paths.prototype.contains = function(x) {
      return this.itemsDict[x] != null;
    };
    Paths.prototype.next = function() {
      if (this.items.length === 0) {
        return null;
      }
      this.pos = (this.pos + 1) % this.numItems;
      return this.items[this.pos];
    };
    return Paths;
  })();
  exports.StatWatcher = StatWatcher = (function() {
    __extends(StatWatcher, events.EventEmitter);
    function StatWatcher(top, opt) {
      var options;
      events.EventEmitter.call(this);
      options = opt || {};
      this.ignore = opt.ignore != null ? new RegExp(opt.ignore) : null;
      this.match = opt.match != null ? new RegExp(opt.match) : null;
      this.sampleRate = opt['sample-rate'] != null ? 1 * opt['sample-rate'] : 5;
      this.maxStatsPending = 10;
      this.paths = new Paths();
      this.paths.add(top);
      this.path_mtime = {};
      this.numStatsPending = 0;
      this.preexistingPathsToReport = {};
      this.numPreexistingPathsToReport = 0;
      pathsIn(top, __bind(function(paths) {
        var path, _i, _len;
        for (_i = 0, _len = paths.length; _i < _len; _i++) {
          path = paths[_i];
          if ((!this.paths.contains(path)) && (!this.ignore || !path.match(this.ignore)) && (!this.match || path.match(this.match))) {
            this.preexistingPathsToReport[path] = true;
            this.numPreexistingPathsToReport++;
            this.paths.add(path);
            this.statPath(path);
          }
        }
        return this.intervalId = setInterval((__bind(function() {
          return this.tick();
        }, this)), this.sampleRate);
      }, this));
    }
    StatWatcher.prototype.end = function() {
      return clearInterval(this.intervalId);
    };
    StatWatcher.prototype.tick = function() {
      var path;
      if (this.numStatsPending <= this.maxStatsPending) {
        path = this.paths.next();
        if (path) {
          return this.statPath(path);
        }
      }
    };
    StatWatcher.prototype.statPath = function(path) {
      this.numStatsPending++;
      return fs.stat(path, __bind(function(err, stats) {
        var eventName, last_mtime;
        this.numStatsPending--;
        last_mtime = this.path_mtime[path] || null;
        if (err) {
          if (err.errno === ENOENT) {
            if (last_mtime) {
              this.emit('fileDeleted', path);
              delete this.path_mtime[path];
            }
          } else {
            throw err;
          }
        } else {
          this.path_mtime[path] = stats.mtime;
          if (stats.isDirectory()) {
            if ((!last_mtime) || (stats.mtime > last_mtime)) {
              this.scanDir(path);
            }
          } else {
            if (!last_mtime) {
              eventName = 'fileCreated';
              if (this.preexistingPathsToReport[path]) {
                eventName = 'filePreexisted';
                delete this.preexistingPathsToReport[path];
                this.numPreexistingPathsToReport--;
              }
              this.emit(eventName, path, stats);
            } else if (stats.mtime > last_mtime) {
              this.emit('fileModified', path, stats);
            }
          }
        }
        if (this.numPreexistingPathsToReport === 0) {
          this.emit('allPreexistingFilesReported');
          return this.numPreexistingPathsToReport = -1;
        }
      }, this));
    };
    StatWatcher.prototype.scanDir = function(path) {
      return fs.readdir(path, __bind(function(err, files) {
        var file, path2, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          path2 = "" + path + "/" + file;
          _results.push((!this.paths.contains(path2)) && (!this.ignore || !path2.match(this.ignore)) && (!this.match || path2.match(this.match)) ? (this.paths.add(path2), this.statPath(path2)) : void 0);
        }
        return _results;
      }, this));
    };
    return StatWatcher;
  })();
  _pathsIn = function(path, paths, callback) {
    return fs.readdir(path, function(err, files) {
      if (err && err.errno === ENOTDIR) {
        paths.push(path);
        return callback();
      }
      if (err) {
        throw err;
      }
      return async.forEach(files, (function(file, cb) {
        return _pathsIn("" + path + "/" + file, paths, cb);
      }), (function(err) {
        if (err) {
          throw err;
        }
        return callback();
      }));
    });
  };
  pathsIn = function(dir, callback) {
    var paths;
    paths = [];
    return _pathsIn(dir, paths, function() {
      return callback(paths);
    });
  };
}).call(this);
