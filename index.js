var Assets = require("./lib/assets");
var compilers = require("./lib/compilers");

var connectAssets = module.exports = function (options) {
  options = connectAssets.parseOptions(options || {});
  return new Assets(options).middleware;
};

connectAssets.parseOptions = function (options) {
  options.env = options.env || process.env.NODE_ENV;
  options.src = options.src || "assets";
  options.helperContext = options.helperContext || global;
  options.buildDir = options.buildDir || "builtAssets";
  options.build = options.build || (options.env == "production" ? true : false);
  options.detectChanges = options.detectChanges || (options.env == "production" ? false : true);
  options.jsCompilers = extend({}, compilers.js, options.jsCompilers || {});
  options.cssCompilers = extend({}, compilers.css, options.cssCompilers || {});

  return options;
};

var extend = function () {
  var destination = arguments[0];
  
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    for (var key in obj) {
      destination[key] = obj[key];
    }
  }

  return destination;
};