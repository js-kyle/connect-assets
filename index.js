var url = require("url");
var Assets = require("./lib/assets");

var connectAssets = module.exports = function (options) {
  options = parseOptions(options || {});

  var assets = new Assets(options);

  // TODO: environment.registerHelper asset_path?
  options.helperContext.css = assets.helper(tagWriters.css);
  options.helperContext.js = assets.helper(tagWriters.js);
  options.helperContext.assetPath = assets.helper(tagWriters.noop);

  assets.compile();

  return function (req, res, next) {
    var path = url.parse(req.url).pathname.replace(/^\//, "");

    if (path.toLowerCase().indexOf(options.servePath.toLowerCase()) === 0) {
      assets.serveAsset(req, res, next);
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
  options.precompile = arrayify(options.precompile || []);
  options.build = options.build || isProduction;

  return options;
};

var arrayify = module.exports._arrayify = function (target) {
  return (target instanceof Array) ? target : [ target ];
};

var tagWriters = {
  css: function (url) { return '<link rel="stylesheet" href="' + url + '" />'; },
  js: function (url) { return '<script src="' + url + '"></script>'; },
  noop: function (url) { return url; }
};
