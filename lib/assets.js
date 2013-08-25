var mincer = require("mincer");
var url = require("url");
var http = require("http");

var Assets = module.exports = function (options) {
  this.options = options;
  this.environment = new mincer.Environment();
  this.options.paths.forEach(this.environment.appendPath, this.environment);
};

Assets.prototype.compile = function () {
  var instance = this;

  this.environment.eachLogicalPath(this.options.precompile, function (path) {
    try { instance.environment.findAsset(path); }
    catch (err) {
      // Swallow silently -- when the asset helper is used later the error
      // will be raised again.
    }
  });
};

Assets.prototype.serveAsset = function (req, res, next) {
  var path = url.parse(req.url).pathname.replace(/^\//, "");
  path = path.substr(this.options.servePath.length).replace(/^\//, "");
  path = decodeURIComponent(path);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end(http.STATUS_CODES[405]);
  }

  if (isInvalidPath(path)) {
    res.writeHead(400);
    return res.end(http.STATUS_CODES[400]);
  }

  var parts = parse(path);
  var asset;

  try {
    asset = this.environment.findAsset(parts.path, { bundle: this.options.build });
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

Assets.prototype.helper = function (tagWriter) {
  var instance = this;

  return function (path) {
    var asset = instance.environment.findAsset(path);

    if (!asset) {
      var searchPath = instance.environment.__trail__.paths.toArray().join("\n    ");
      throw new Error("Asset '" + path + "' not found in search path:\n    " + searchPath);
    }

    var getTag = function (asset) {
      var path = "/" + asset.logicalPath;
      // It's possible that you don't want to use servePath, but if you do we'll prepend it
      if (instance.options.servePath.length) {
        path = "/" + instance.options.servePath + path;
      }
      return tagWriter(path.replace(/(\.[^.]+)$/, "-" + asset.digest + "$1"));
    };

    if (!instance.options.build && asset.type === "bundled") {
      var assets = asset.toArray();
      var tags = [];

      for (var i = 0; i < assets.length; i++) {
        tags.push(getTag(assets[i]));
      };

      return tags.join("\n");
    }
    else {
      return getTag(asset);
    }
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
