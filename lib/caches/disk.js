var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var EventEmitter = require("events").EventEmitter;

// TODO: Implement an in-memory cache for this (using ./memory.js?)

var DiskCache = module.exports = function (options) {
  this.folder = options.buildDir;
  this.cache = {};
};

DiskCache.prototype = new EventEmitter();

DiskCache.prototype.add = function (key, version, contents, callback) {
  var file = path.normalize(this.folder + path.sep + key);
  var folder = path.dirname(file);

  mkdirp(folder, function (err) {
    if (err) return callback(err);
    fs.writeFile(file, contents, "utf-8", callback);
  });
};

DiskCache.prototype.get = function (key, callback) {
  var file = path.normalize(this.folder + path.sep + key);
  fs.readFile(file, "utf-8", callback);
};

DiskCache.prototype.contains = function (key, version, callback) {
  var file = path.normalize(this.folder + path.sep + key);

  fs.stat(file, function (err, stats) {
    if (err) {
      if (err.code == "ENOENT") return callback(null, false);
      else return callback(err);
    }

    return callback(null, stats.mtime.getTime() >= version);
  });
};