var fs = require("fs");
var path = require("path");
var EventEmitter = require("events").EventEmitter;
var async = require("async");

var ignored = [".", ".."];

var FileManager = module.exports = function (options) {
  this.options = options;
  this.cache = options.saveToDisk 
    ? new (require("./caches/disk"))(options)
    : new (require("./caches/memory"))(options);

  this.updateTree();
};

FileManager.prototype = new EventEmitter();

FileManager.prototype.updateTree = function () {
  this.scanDirectory(this.options.src, function (err, tree) {
    if (err) throw err;

    this.tree = tree;
    this.emit("available", tree);
  }.bind(this));
};

FileManager.prototype.scanDirectory = function (dir, callback) {
  fs.readdir(dir, function (err, paths) {
    if (err) {
      if (err.code == "ENOENT") return callback(null, {});
      else return callback(err);
    }

    var fns = {};

    for (var i = 0; i < paths.length; i++) {
      fns[paths[i]] = this.scanDirectoryItem(dir + path.sep + paths[i]);
    };

    async.parallel(fns, function (err, tree) {
      if (err) return callback(err);
      callback(null, removeFileExtensions(tree));
    });
  }.bind(this));
};

FileManager.prototype.scanDirectoryItem = function (item) {
  return function (callback) {
    fs.stat(item, function (err, stats) {
      if (err) return callback(err);
      if (stats.isFile()) return this.scanFile(item, callback);
      if (stats.isDirectory()) return this.scanDirectory(item, callback);
    }.bind(this));
  }.bind(this);
};

FileManager.prototype.scanFile = function (file, callback) {
  var extension = path.extname(file).substring(1);
  var compiler = this.options.compilers[extension];

  if (!compiler) 
    return callback(null, null);

  // Don't throw/callback errors from the compiler just yet. If we did, we'd
  // see compilation errors at startup for a bunch of files we may not be 
  // using. 
  // 
  // Instead, we'll hold on to the errors from compilation and pretend that 
  // they occurred when the file is requested from the server (as if the file
  // was compiled on-demand).
  compiler.getOrderedFileList(file, this.options.build, function (err, fileList, contents) {
    fileList = fileList || [];
    fileList.err = err;
    var fns = {};

    for (var i = 0; i < fileList.length; i++) {
      var item = fileList[i];
      fns[item.filename] = this.buildCache(item, compiler);
    };

    async.parallel(fns, function (err, compilationErrs) {
      if (err) return callback(err);

      for (var filename in compilationErrs) {
        for (var i = 0; i < fileList.length; i++) {
          var list = fileList[i];

          if (list.filename == filename) {
            list.err = compilationErrs[filename];
            break;
          }
        };
      }

      return callback(null, fileList);
    });
  }.bind(this));
};

FileManager.prototype.buildCache = function (file, compiler) {
  return function (callback) {
    this.cache.contains(file.filename, file.version, function (err, cacheContainsFile) {
      if (err) return callback(null, err);
      if (cacheContainsFile) return callback();

      compiler.compile(file.filename, this.options.build, function (err, data) {
        if (err) return callback(null, err);

        this.cache.add(file.route, file.version, data, function (err) {
          return callback(null, err);
        });
      }.bind(this));
    }.bind(this));
  }.bind(this);
};

FileManager.prototype.lookupUrl = function (url, callback) {
  if (this.tree) return this._lookupUrl(url, callback);
  else return this.once("available", this._lookupUrl.bind(this, url, callback));
};

FileManager.prototype._lookupUrl = function (url, callback) {
  var matches = url.match(/^(.+)\.(css|js)(\?.+)?$/);

  if (!matches) return callback(null);
  else {
    var route = matches[1];
    var parts = route.split("/").filter(function (item) { return item; });
    var fileList = walk(this.tree, parts);

    if (!fileList) return callback(null);
    if (fileList.err) return callback(fileList.err);

    var file = fileList[fileList.length - 1];
    if (file.err) return callback(file.err);

    this.cache.get(file.route, callback);
  }
};

FileManager.prototype.resolveFileList = function (route) {
  var parts = route.split("/").filter(function (item) { return item; });
  var fileList = walk(this.tree || {}, parts);

  if (!fileList) return null;

  return this.convertToRoutes(fileList);
};

FileManager.prototype.convertToRoutes = function (fileList) {
  var routes = [];
  
  for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    var route = file.route.replace(this.options.src, "");
    routes.push(route + "?v=" + file.version);
  };

  return routes;
};

var walk = function (tree, items) {
  if (!items.length) return tree;
  var subtree = tree[items.shift()];

  if (subtree) return walk(subtree, items);
  else return null;
};

var removeFileExtensions = function (tree) {
  for (var key in tree) {
    var value = tree[key];

    if (value.length) {
      var extension = path.extname(key);
      var cleanedFilename = key.replace(extension, "");
      
      delete tree[key];
      tree[cleanedFilename] = value;
    }
    else {
      tree[key] = removeFileExtensions(value);
    }
  }

  return tree;
};