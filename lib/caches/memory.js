var MemoryCache = module.exports = function (options) {
  this.cache = {};
};

MemoryCache.prototype.add = function (key, version, contents, callback) {
  this.cache[key] = contents;
  this.cache[key].version = version;
  process.nextTick(callback);
};

MemoryCache.prototype.get = function (key, callback) {
  process.nextTick(function () {
    callback(null, this.cache[key]);
  }.bind(this));
};

MemoryCache.prototype.contains = function (key, version, callback) {
  process.nextTick(function () {
    callback(null, this.cache[key] && this.cache[key].version == version);
  }.bind(this));
};