var url = require("url");
var fs = require("fs");
var Mincer = require("mincer");
var Assets = require("./lib/assets");

var connectAssets = module.exports = function (options, configureCallback) {
  options = parseOptions(options || {});

  var assets = new Assets(Mincer, options);
  var compilationComplete = false;
  var compilationError;
  var waiting = [];

  options.helperContext.css = assets.helper(tagWriters.css, "css");
  options.helperContext.cssInline = assets.helper(tagWriters.cssInline, "css");
  options.helperContext.js = assets.helper(tagWriters.js, "js");
  options.helperContext.jsInline  = assets.helper(tagWriters.jsInline, "js");
  options.helperContext.assetPath = assets.helper(tagWriters.noop);

  if (configureCallback) {
    configureCallback(assets);
  }

  assets.compile(function (err) {
    if (err) { compilationError = err; }
    compilationComplete = true;

    for (var i = 0; i < waiting.length; i++) {
      waiting[i]();
    };
  });

  var middleware = function (req, res, next) {
    var path = url.parse(req.url).pathname.replace(/^\//, "");

    if (path.toLowerCase().indexOf(options.localServePath.toLowerCase()) === 0) {
      var serve = function (req, res, next) {
        if (compilationError) { next(compilationError); }
        else { assets.serveAsset(req, res, next); }
      };

      if (compilationComplete) { serve(req, res, next); }
      else { waiting.push(serve.bind(this, req, res, next)); }
    }
    else {
      next();
    }
  };

  Object.keys(assets).forEach(function (method) {
    middleware[method] = assets[method];
  });

  Object.keys(assets.__proto__).forEach(function (method) {
    middleware.__proto__[method] = assets.__proto__[method];
  });

  return middleware;
};

module.exports.Mincer = Mincer

var parseOptions = module.exports._parseOptions = function (options) {
  var isProduction = process.env.NODE_ENV === "production";
  var isDevelopment = !isProduction;
  var servePath = (options.servePath || "assets");
  var servePathPathname = parseUrl(servePath).pathname || "/";

  options.paths = arrayify(options.paths || options.src || [ "assets/js", "assets/css" ]);
  options.helperContext = options.helperContext || global;
  options.servePath = servePath.replace(/^\//, "").replace(/\/$/, "");
  options.localServePath = options.localServePath || servePathPathname.replace(/^\//, "");
  options.precompile = arrayify(options.precompile || ["*.*"]);
  options.build = options.build != null ? options.build : isProduction;
  options.buildDir = options.buildDir != null ? options.buildDir : "builtAssets";
  options.compile = options.compile != null ? options.compile : true;
  options.bundle = options.bundle != null ? options.bundle : isProduction;
  options.compress = options.compress != null ? options.compress : isProduction;
  options.sourceMaps = options.sourceMaps != null ? options.sourceMaps : isDevelopment;
  options.gzip = options.gzip != null ? options.gzip : false;
  options.fingerprinting = options.fingerprinting != null ? options.fingerprinting : isProduction;

  if (options.buildDir.replace) {
    options.buildDir = options.buildDir.replace(/^\//, "").replace(/\/$/, "");
  }

  return options;
};

var arrayify = module.exports._arrayify = function (target) {
  return (target instanceof Array) ? target : [ target ];
};

var pasteAttr = function (attributes) {
  return !!attributes ? ' ' + attributes : '';
};

var parseUrl = function (string) {
  var parseQueryString = false;
  var allowUrlWithoutProtocol = true;
  return url.parse(string, parseQueryString, allowUrlWithoutProtocol);
};

var tagWriters = {
  css: function (url, contentProvider, attr) { return '<link rel="stylesheet" href="' + url + '"' + pasteAttr(attr) + ' />'; },
  cssInline: function (url, contentProvider, attr) { return '<style'  + pasteAttr(attr) + '>' + contentProvider() + '</style>';  },
  js: function (url, contentProvider, attr) { return '<script src="' + url + '"' + pasteAttr(attr) + '></script>'; },
  jsInline : function (url, contentProvider, attr) { return '<script' + pasteAttr(attr) + '>' + contentProvider() + '</script>'; },
  noop: function (url) { return url; },
};
