var MemoryCache = module.exports = function () {
  this.cache = {};
};

MemoryCache.prototype.add = function (key, version, contents, callback) {
  this.cache[key] = {
    contents: contents,
    version: version
  };
  process.nextTick(callback);
};

MemoryCache.prototype.get = function (key, callback) {
  process.nextTick(function () {
    callback(null, this.cache[key].contents);
  }.bind(this));
};

MemoryCache.prototype.contains = function (key, version, callback) {
  process.nextTick(function () {
    callback(null, !!(this.cache[key] && this.cache[key].version >= version));
  }.bind(this));
};