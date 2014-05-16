var url = require("url");
var Assets = require("./lib/assets");

var connectAssets = module.exports = function (options) {
  options = parseOptions(options || {});

  var assets = new Assets(options);
  var compilationComplete = false;
  var compilationError;
  var waiting = [];

  // TODO: environment.registerHelper asset_path?
  options.helperContext.css = assets.helper(tagWriters.css, "css");
  options.helperContext.js = assets.helper(tagWriters.js, "js");
  options.helperContext.assetPath = assets.helper(tagWriters.noop);

  assets.compile(function (err) {
    if (err) { compilationError = err; }
    compilationComplete = true;

    for (var i = 0; i < waiting.length; i++) {
      waiting[i]();
    };
  });

  return function (req, res, next) {
    var path = url.parse(req.url).pathname.replace(/^\//, "");

    if (path.toLowerCase().indexOf(options.servePath.toLowerCase()) === 0) {
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
};

var parseOptions = module.exports._parseOptions = function (options) {
  var isProduction = process.env.NODE_ENV === "production";
  var isDevelopment = !isProduction;

  options.paths = arrayify(options.paths || options.src || [ "assets/js", "assets/css" ]);
  options.helperContext = options.helperContext || global;
  options.servePath = (options.servePath || "assets").replace(/^\//, "").replace(/\/$/, "");
  options.precompile = arrayify(options.precompile || ["*.*"]);
  options.build = options.build != null ? options.build : isProduction;
  options.buildDir = options.buildDir != null ? options.buildDir : isDevelopment ? false : "builtAssets";
  options.compile = options.compile != null ? options.compile : true;
  options.compress = options.compress != null ? options.compress : isProduction;

  if (options.buildDir.replace)
    options.buildDir = options.buildDir.replace(/^\//, "").replace(/\/$/, "");

  return options;
};

var arrayify = module.exports._arrayify = function (target) {
  return (target instanceof Array) ? target : [ target ];
};

var pasteAttr = function(str) {
  return !!str ? ' '+str : '';  
};

var tagWriters = {
  css: function (url, attr) { return '<link rel="stylesheet" href="' + url + '"' + pasteAttr(attr) + ' />'; },
  js: function (url, attr) { return '<script src="' + url + '"' + pasteAttr(attr) + '></script>'; },
  noop: function (url) { return url; }
};
