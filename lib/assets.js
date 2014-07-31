var mincer = require("mincer");
var url = require("url");
var http = require("http");

var Assets = module.exports = function (options) {
  this.options = options;

  if (this.options.compile) {
    this.environment = new mincer.Environment();

    this.environment.ContextClass.defineAssetPath(this.helper(function (url) {
      return url;
    }));

    if (this.options.compress) {
      this.environment.cssCompressor = "csswring";
      this.environment.jsCompressor = "uglify";
    }

    this.options.paths.forEach(this.environment.appendPath, this.environment);

    if (this.options.buildDir) {
      this.manifest = new mincer.Manifest(this.environment, this.options.buildDir);
    }
  }
  else {
    this.manifest = new mincer.Manifest(null, this.options.buildDir);
  }
};

Assets.prototype.compile = function (callback) {
  var instance = this;

  if (!this.options.compile) {
    return;
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
  var path = url.parse(req.url).pathname.replace(/^\//, "");
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
  var asset;

  try {
    if (!this.options.compile) {
      asset = this.manifest.assets[parts.path];
    }
    else {
      asset = this.environment.findAsset(parts.path, { bundle: this.options.build });
    }
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

Assets.prototype.helper = function (tagWriter, ext) {
  var instance = this;

  return function (path, options) {
    var asset;
    var regExp = new RegExp("\\." + ext + "$");
    var pathHasNoExt = !regExp.test(path);

    if (ext && pathHasNoExt) {
      path = path + "." + ext;
    }

    if (!instance.options.compile) {
      asset = instance.manifest.assets[path];
    }
    else {
      asset = instance.environment.findAsset(path);
    }

    if (!asset) {
      var searchPath = instance.options.compile
        ? "search path:\n    " + instance.environment.__trail__.paths.toArray().join("\n    ")
        : "manifest:\n    " + instance.options.buildDir + "/manifest.json";
      throw new Error("Asset '" + path + "' not found in " + searchPath);
    }

    var getTag = function (asset) {
      var servePath = instance.options.servePath;
      var path = servePath + "/" + asset.logicalPath;
      var attributes = parseAttributes(options);

      if (!isAbsolutePath(servePath)) {
        path = "/" + path;
      }

      return tagWriter(path.replace(/(\.[^.]+)$/, "-" + asset.digest + "$1"), attributes);
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

var isAbsolutePath = function (pathname) {
  return pathname.indexOf("http") === 0 || pathname.indexOf("//") === 0;
};

var parse = function (path) {
  var fingerprint = /-([0-9a-f]{32,40})(\.[^.]+)$/;
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
