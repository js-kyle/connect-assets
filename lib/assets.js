var path = require("path");
var fs = require("fs");

var Assets = module.exports = function (options) {
  this.options = options;
  this.tagWriter = this.options.pathsOnly
    ? require("./tagWriters/passthroughWriter")
    : require("./tagWriters/xHtml5Writer");

  this.registerHelpers();
};

Assets.prototype.registerHelpers = function () {
  this.options.helperContext.css = this.css.bind(this);
  this.options.helperContext.js = this.js.bind(this);
};

// This method must be synchronous.
Assets.prototype.css = function (route) {
  // Do nothing with remote URLs.
  if (route.match(REMOTE_PATH)) {
    return this.tagWriter.cssTag(route);
  }

  var files = this.getOrderedFileList("css", route);

  // We can't serve this asset; allow it to 404.
  if (!files) {
    return this.tagWriter.cssTag(this.getRoute("css", route));
  }

  var tags = [];

  for (var i = 0; i < files.length; i++) {
    tags.push(this.tagWriter.cssTag(files[i]));
  };

  return tags.join("\n");
};

// This method must be synchronous.
Assets.prototype.js = function (route, options) {
   // Do nothing with remote URLs.
  if (route.match(REMOTE_PATH)) {
    return this.tagWriter.jsTag(route);
  }

  var files = this.getOrderedFileList("js", route);

  // We can't serve this asset; allow it to 404.
  if (!files) {
    return this.tagWriter.jsTag(this.getRoute("js", route));
  }

  var tags = [];

  for (var i = 0; i < files.length; i++) {
    tags.push(this.tagWriter.jsTag(files[i]));
  };

  return tags.join("\n");
};

Assets.prototype.getOrderedFileList = function (assetType, route) {
  var filePath = path.normalize(this.options.src);
  route = normalize("/" + assetType + "/" + route);
  var compilers = this.options.compilers[assetType];
  
  for (var extension in compilers) {
    var compiler = compilers[extension];
    var files = compiler.getOrderedFileList(filePath, route, this.options.build);

    if (files) return files;
  }

  return null;
};

Assets.prototype.getCompiledOutput = function (assetType, route, callback) {
  var filePath = path.normalize(this.options.src);
  var compilers = this.options.compilers[assetType];
  var extensions = [];

  for (var extension in compilers) {
    extensions.push(extension);
  }

  var tryCompile = function () {
    if (!extensions.length) {
      return callback(null);
    }

    var compiler = compilers[extensions.shift()];

    compiler.compile(filePath, route, this.options.build, function (err, capable, data) {
      if (err) return callback(err);
      if (capable) return callback(null, data);
      tryCompile();
    });
  }.bind(this);

  tryCompile();
};

Assets.prototype.getRoute = function (assetType, partialRoute) {
  return normalize("/" + assetType + "/" + partialRoute + "." + assetType);
};

Assets.prototype.middleware = function (req, res, next) {
  var css = req.url.match(/(\/css\/.+)\.css/);
  var js = req.url.match(/(\/js\/.+)\.js/);

  if (css) {
    this.getCompiledOutput("css", css[1], function (err, output) {
      if (err) return next(err);
      if (!output) return next();
      res.end(output);
    });
  } else if (js) {
    this.getCompiledOutput("js", js[1], function (err, output) {
      if (err) return next(err);
      if (!output) return next();
      res.end(output);
    });
  } else {
    return next();
  }
};

var normalize = function (url) {
  return url.replace(/\/\//g, "/");
};

var REMOTE_PATH = /\/\//;