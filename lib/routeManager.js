var path = require("path");
var async = require("async");
var AssetScanner = require("./assetScanner");

var RouteManager = module.exports = function (options) {
  this.options = options;
  this.routeTable = {};
  this.cache = options.saveToDisk 
    ? new (require("./caches/disk"))(options)
    : new (require("./caches/memory"))(options);

  this.assetScanner = new AssetScanner(options);
  this.assetScanner.onFile = this.scanFile.bind(this);
  this.assetScanner.scan();
};

RouteManager.prototype.scanFile = function (file, callback) {
  var extension = path.extname(file);
  var route = file.replace(this.options.src, "");
  var compiler = this.options.compilers[extension.substring(1)];

  if (!compiler) 
    return callback(null, null);

  // Don't throw/callback errors from the compiler just yet. If we did, we'd
  // see compilation errors at startup for a bunch of files we may not be 
  // using. 
  // 
  // Instead, we'll hold on to the errors from compilation and pretend that 
  // they occurred when the file is requested from the server (as if the file
  // was compiled on-demand).
  compiler.getOrderedFileList(this.options.src, route, this.options.build, function (err, fileList, contents) {
    fileList = fileList || [];
    fileList.err = err;
    var fns = {};

    for (var i = 0; i < fileList.length; i++) {
      var item = fileList[i];
      fns[item.filename] = this.buildCache.bind(this, item, compiler);
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

      this.routeTable[route.replace(extension, "")] = fileList;
      return callback(null);
    }.bind(this));
  }.bind(this));
};

RouteManager.prototype.buildCache = function (file, compiler, callback) {
  this.cache.contains(file.route, file.version, function (err, cacheContainsFile) {
    if (err) return callback(null, err);
    if (cacheContainsFile) return callback();

    var filename = this.options.src + path.sep + file.filename;

    compiler.compile(filename, this.options.build, function (err, data) {
      if (err) return callback(null, err);

      this.cache.add(file.route, file.version, data, function (err) {
        return callback(null, err);
      });
    }.bind(this));
  }.bind(this));
};

// Part of the middleware pipeline
RouteManager.prototype.processIncomingRequest = function (url, callback) {
  // Delay execution of this function if the assetScanner hasn't fully
  // initialized yet. This will delay HTTP traffic by design.
  if (!this.assetScanner.initialized)
    return this.assetScanner.once("initialized", 
      this.processIncomingRequest.bind(this, url, callback));

  var matches = url.match(/^(.+)\.(css|js)(\?.+)?$/);

  if (!matches) return callback(null);

  var route = matches[1];
  var fileList = this.routeTable[route];

  if (!fileList) return callback(null);
  if (fileList.err) return callback(fileList.err);

  var file = fileList[fileList.length - 1];
  if (file.err) return callback(file.err);

  this.cache.get(file.route, callback);
};

// Called from the view helpers.
RouteManager.prototype.resolveFileList = function (route) {
  var fileList = this.routeTable[route];
  var routes = [];

  if (!fileList) return null;

  for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    var route = file.route.replace(this.options.src, "");
    routes.push(route + "?v=" + file.version);
  };

  return routes;
};