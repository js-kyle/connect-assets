var url = require("url");
var Blarg = require("./blarg");
var tagWriters = require("./tagWriters");

var connectAssets = module.exports = function (options) {
  options = parseOptions(options || {});

  var blarg = new Blarg({
    paths: options.paths,
    precompile: options.precompile,
    build: options.build,
    servePath: options.servePath
  });

  // TODO: environment.registerHelper asset_path?
  options.helperContext.css = blarg.helper(tagWriters.css);
  options.helperContext.js = blarg.helper(tagWriters.js);
  options.helperContext.assetPath = blarg.helper(tagWriters.noop);

  blarg.compileAssets();

  return function (req, res, next) {
    // Since compiling is async, and view rendering is sync, we need to delay
    // views from being rendered until compilation has completed. The only
    // practical way of doing this is holding up requests from being processed.
    blarg.whenFinishedCompiling(function () {
      var path = url.parse(req.url).pathname.replace(/^\//, "");

      if (path.toLowerCase().indexOf(options.servePath.toLowerCase()) === 0) {
        blarg.serveAsset(req, res, next);
      }
      else {
        next();
      }
    });
  };
};

var parseOptions = module.exports._parseOptions = function (options) {
  var isProduction = process.env.NODE_ENV === "production";
  var isDevelopment = !isProduction;

  options.paths = arrayify(options.paths || options.src || [ "assets/js", "assets/css" ]);
  options.helperContext = options.helperContext || global;
  options.servePath = (options.servePath || "assets").replace(/^\//, "");
  options.precompile = arrayify(options.precompile || []);
  options.watch = options.watch || options.detectChanges || isDevelopment;
  options.build = options.build || isProduction;

  return options;
};

var arrayify = module.exports._arrayify = function (target) {
  return (target instanceof Array) ? target : [ target ];
};

var helper = module.exports._helper = function (environment, path) {
  var asset = environment.findAsset(path);
  var paths = [];

  return paths;
};

var whenFinishedCompiling = module.exports._whenFinishedCompiling = function (environment, fn) {

};
