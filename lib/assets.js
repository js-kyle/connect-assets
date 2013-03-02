var path = require("path");
var fs = require("fs");
var FileManager = require("./fileManager");

var Assets = module.exports = function (options) {
  this.options = options;
  this.fileManager = new FileManager(options);
  this.tagWriter = this.options.pathsOnly
    ? require("./tagWriters/passthroughWriter")
    : require("./tagWriters/xHtml5Writer");

  this.registerHelpers();
};

Assets.prototype.registerHelpers = function () {
  this.options.helperContext.css = this.helper.bind(this, "css");
  this.options.helperContext.js = this.helper.bind(this, "js");
};

Assets.prototype.helper = function (extension, route, options) {
  var writeTag = extension == "css" 
    ? this.tagWriter.cssTag 
    : this.tagWriter.jsTag;

  // Do nothing with remote URLs.
  if (route.match(/\/\//)) {
    return writeTag(route);
  }

  var assetFolder = this.options.assetFolders[extension];
  var fullRoute = normalizeUrl("/" + assetFolder + "/" + route);
  var files = this.fileManager.resolveFileList(fullRoute);

  // We can't serve this asset; allow (a) it to 404 or 
  // (b) other middleware to handle it.
  if (!files) {
    var fileName = normalizeUrl("/" + fullRoute + "." + extension);
    return writeTag(fileName);
  }

  // Convert the list of files returned 
  var tags = [];

  for (var i = 0; i < files.length; i++) {
    tags.push(writeTag(files[i]));
  };

  return tags.join("\n");
};

Assets.prototype.middleware = function (req, res, next) {
  this.fileManager.lookupUrl(req.url, function (err, contents) {
    if (err) return next(err);
    if (contents) return res.end(contents);
    return next();
  });
};

var normalizeUrl = function (url) {
  return url.replace(/\/\/+/g, "/");
};