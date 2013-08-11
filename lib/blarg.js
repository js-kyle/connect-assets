var mincer = require("mincer");
var url = require("url");

var Blarg = module.exports = function (options) {
  this.precompile = options.precompile;
  this.build = options.build;
  this.servePath = options.servePath;

  this.environment = new mincer.Environment();
  this.isCompiling = false;
  this.delayedFns = [];
  this.errors = [];

  options.paths.forEach(this.environment.appendPath, this.environment);
};

Blarg.prototype.compileAssets = function () {
  if (this.isCompiling) {
    return delayedFns.push(this.compileAssets.bind(this));
  }

  this.isCompiling = true;

  var paths = [];

  this.environment.eachLogicalPath(this.precompile, function (pathname) {
    paths.push(pathname);
  });

  // TODO: It feels like this really should be an async method -- but will have
  // to work with Mincer's developer to find out why it recently became sync.

  var instance = this;
  paths.forEach(function (path) {
    var asset;
    try {
      asset = instance.environment.findAsset(path);
    }
    catch (err) {
      instance.errors[path] = err;
    }
  });

  this.isCompiling = false;
};

Blarg.prototype.whenFinishedCompiling = function (fn) {
  this.isCompiling ? this.delayedFns.push(fn) : fn();
};

Blarg.prototype.serveAsset = function (req, res, next) {
  var path = url.parse(req.url).pathname.replace(/^\//, "");
  path = path.substr(this.servePath.length).replace(/^\//, "");
  path = decodeURIComponent(path);

  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  if (isInvalidPath(path)) {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  var parts = parse(path);
  var asset;

  try {
    asset = this.environment.findAsset(parts.path, { bundle: this.build });
  }
  catch (err) {
    return next(err);
  }

  if (!asset || asset.digest !== parts.fingerprint) {
    return next();
  }

  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.setHeader("Date", (new Date()).toUTCString());
  res.setHeader("Last-Modified", asset.mtime.toUTCString());
  res.setHeader("ETag", '"' + asset.digest + '"');

  if (req.headers["if-none-match"] === '"' + asset.digest + '"') {
    res.writeHead(304);
    return res.end();
  }

  var contentType = asset.contentType;

  if (contentType.match(/^text\/|\/json$|\/javascript$/)) {
    contentType += "; charset=UTF-8";
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", asset.length);

  if (req.method === "HEAD") {
    return res.end();
  }

  res.end(asset.buffer);
};

Blarg.prototype.helper = function (tagWriter) {
  var instance = this;

  return function (path) {
    var asset = instance.environment.findAsset(path);
    var path = "/" + instance.servePath + "/" + asset.logicalPath
    return tagWriter(path.replace(/(\.[^.]+)$/, "-" + asset.digest + "$1"));
  };
};

var isInvalidPath = function (pathname) {
  return pathname.indexOf("..") !== -1 || pathname.indexOf("\u0000") !== -1;
};

var parse = function (path) {
  var fingerprint = /-([0-9a-f]{32,40})(\.[^.]+)$/;
  var parts = path.match(fingerprint);

  return {
    fingerprint: parts ? parts[1] : null,
    path: path.replace(fingerprint, "") + (parts ? parts[2] : "")
  };
};
