var url = require("url");
var http = require("http");
var fs = require("fs");
var pathModule = require("path");
var mime = require("mime");

var Assets = module.exports = function (Mincer, options) {
  if (!options) {
    options = Mincer
    Mincer = require('mincer')
  }
  
  this.options = options;

  if (this.options.compile) {
    this.environment = new Mincer.Environment();

    this.environment.ContextClass.defineAssetPath(this.helper(function (url) {
      return url;
    }));

    if (this.options.compress) {
      this.environment.cssCompressor = "csswring";
      this.environment.jsCompressor = "uglify";
    }

    if (this.options.sourceMaps) {
      this.environment.enable("source_maps");
    }

    this.options.paths.forEach(this.environment.appendPath, this.environment);

    if (this.options.buildDir) {
      this.manifest = new Mincer.Manifest(this.environment, this.options.buildDir);
    }
  }
  else {
    this.manifest = new Mincer.Manifest(null, this.options.buildDir);
  }
};

Assets.prototype.compile = function (callback) {
  var instance = this;

  if (!this.options.compile) {
    return callback();
  }
  if (this.manifest) {
    try {
      var manifestObj = this.manifest.compile(this.options.precompile, { compress: this.options.gzip });
      callback(null, manifestObj);
    }
    catch (err) {
      callback(err);
    }
  }
  else {
    this.environment.eachLogicalPath(this.options.precompile, function (path) {
      try { instance.environment.findAsset(path); }
      catch (err) {
        // Swallow silently -- when the asset helper is used later the error
        // will be raised again.
      }
    });

    process.nextTick(callback);
  }
};

Assets.prototype.serveAsset = function (req, res, next) {
  var path = parseUrl(req.url).pathname.replace(/^\//, "");
  path = path.substr(this.options.localServePath.length).replace(/^\//, "");
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
  var asset, assetName;

  try {
    asset = this.getAssetByPath(parts.path, { bundle: this.options.build });

    if (isPossibleSourceMapPath(path) && !asset) {
      var originalAssetPath = parts.path.substring(0, parts.path.length - 4);
      asset = this.getAssetByPath(originalAssetPath, { bundle: this.options.build });
      if (!asset || !asset.sourceMap) {
        return next();
      }
      res.setHeader("Content-Length", asset.sourceMap.length);
      res.setHeader("Content-Type", "application/json");
      return res.end(asset.sourceMap);
    }

    if (!asset || (this.options.fingerprinting && asset.digest !== parts.fingerprint)) {
      return next();
    }

    if (!this.options.compile) {
      var assetName = this.manifest.assets[parts.path];
      asset.mtime = new Date(asset.mtime);
      asset.length = asset.size;
      asset.contentType = mime.lookup(pathModule.join(this.options.buildDir, assetName));
    }
  }
  catch (err) {
    return next(err);
  }

  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.setHeader("Date", (new Date()).toUTCString());
  res.setHeader("Last-Modified", asset.mtime.toUTCString());
  res.setHeader("ETag", '"' + asset.digest + '"');

  if (req.headers["if-none-match"] === '"' + asset.digest + '"') {
    res.writeHead(304);
    return res.end();
  }

  if (this.options.sourceMaps && asset.sourceMap) {
    var sourceMapPath = pathModule.join(this.options.localServePath, path + ".map");
    if (sourceMapPath.indexOf("http") !== 0) {
      sourceMapPath = "/" + sourceMapPath;
    }
    res.setHeader("X-SourceMap", sourceMapPath);
  }

  var contentType = asset.contentType;

  if (contentType) {
    if (contentType.match(/^text\/|\/json$|\/javascript$/)) {
      contentType += "; charset=UTF-8";
    }

    res.setHeader("Content-Type", contentType);
  }

  res.setHeader("Content-Length", asset.length);

  if (req.method === "HEAD") {
    return res.end();
  }

  if (!asset.buffer) {
    var localFilePath = pathModule.join(this.options.buildDir, assetName);
    return fs.readFile(localFilePath, function (err, data) {
      if (err) return next(err);
      res.end(data);
    });
  }
  else {
    res.end(asset.buffer);
  }
};

Assets.prototype.helper = function (tagWriter, ext) {
  var instance = this;

  return function (path, options) {
    var asset;
    var regExp = new RegExp("\\." + ext + "$");
    var pathHasNoExt = !regExp.test(path);

    if (ext && pathHasNoExt) {
      path = path + "." + ext;
    }

    asset = instance.getAssetByPath(path, { bundle: true });

    if (!asset) {
      var searchPath = instance.options.compile
        ? "search path:\n    " + instance.environment.__trail__.paths.join("\n    ")
        : "manifest:\n    " + instance.options.buildDir + "/manifest.json";
      throw new Error("Asset '" + path + "' not found in " + searchPath);
    }

    var getTag = function (asset) {
      var servePath = instance.options.servePath;
      var path = servePath + "/" + (asset.logicalPath || asset.logical_path);
      var attributes = parseAttributes(options);

      if (!isAbsolutePath(servePath)) {
        path = "/" + path;
      }

      if (instance.options.fingerprinting) {
        path = path.replace(/(\.[^.]+)$/, "-" + asset.digest + "$1");
      }

      return tagWriter(path, attributes);
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

Assets.prototype.getAssetByPath = function (pathname, options) {
  if (!this.options.compile) {
    var assetTitle = this.manifest.assets[pathname];
    return this.manifest.files[assetTitle];
  }
  return this.environment.findAsset(pathname, options);
};

var isInvalidPath = function (pathname) {
  return pathname.indexOf("..") !== -1 || pathname.indexOf("\u0000") !== -1;
};

var isAbsolutePath = function (pathname) {
  return pathname.indexOf("http") === 0 || pathname.indexOf("//") === 0;
};

var isPossibleSourceMapPath = function (pathname) {
  var ext = ".map";
  return pathname.indexOf(ext) === pathname.length - ext.length;
};

var parse = function (path) {
  var fingerprint = /-([0-9a-f]{32,40})(\.[A-Za-z0-9.]+)$/;
  var parts = path.match(fingerprint);

  return {
    fingerprint: parts ? parts[1] : null,
    path: path.replace(fingerprint, "") + (parts ? parts[2] : "")
  };
};

var parseAttributes = function(attributes) {
  attributes = attributes || {};
  var attrs = [];

  for (var name in attributes) {
    var value = attributes[name];

    switch (typeof value) {
      case 'boolean': if (value) { attrs.push(name); } break;
      case 'string': attrs.push(name + '="' + value + '"'); break;
      default: continue;
    }
  }

  return attrs.join(' ');
};

var parseUrl = function (string) {
  var parseQueryString = false;
  var allowUrlWithoutProtocol = true;
  return url.parse(string, parseQueryString, allowUrlWithoutProtocol);
};
