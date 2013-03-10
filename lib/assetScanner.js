var fs = require("fs");
var path = require("path");
var async = require("async");
var EventEmitter = require("events").EventEmitter;

var AssetScanner = module.exports = function (options) {
  this.directory = options.src;
  this.detectChanges = options.detectChanges;
  this.initialized = false;
};

AssetScanner.prototype = new EventEmitter();

AssetScanner.prototype.scan = function () {
  this.scanDirectory(this.directory, function (err) {
    if (err) throw err;

    this.initialized = true;
    this.emit("initialized");
  }.bind(this));
};

AssetScanner.prototype.scanDirectory = function (dir, callback) {
  fs.readdir(dir, function (err, paths) {
    if (err) {
      if (err.code == "ENOENT") return callback(null);
      else return callback(err);
    }

    var fns = {};

    for (var i = 0; i < paths.length; i++) {
      fns[paths[i]] = this.scanDirectoryItem.bind(this, dir + path.sep + paths[i]);
    };

    async.parallel(fns, callback);
  }.bind(this));
};

AssetScanner.prototype.scanDirectoryItem = function (item, callback) {
  fs.stat(item, function (err, stats) {
    if (err) return callback(err);
    if (stats.isFile()) return this.scanFile(item, callback);
    if (stats.isDirectory()) return this.scanDirectory(item, callback);
  }.bind(this));
};

AssetScanner.prototype.scanFile = function (item, callback) {
  if (this.detectChanges) {
    fs.watch(item, { persistent: false }, function (e, filename) {
      this.onFile(item, function (err) {
        if (err) throw err;
      });
    }.bind(this));
  }
  return this.onFile(item, callback);
};