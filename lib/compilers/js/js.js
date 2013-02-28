var path = require("path");
var fs = require("fs");
var uglify = require("uglify-js");

var jsCompiler = module.exports = {};

jsCompiler.getOrderedFileList = function (directory, route, build) {
  var filename = path.normalize(directory + "/" + route + ".js");
  var stats;

  try {
    stats = fs.statSync(filename);
  }
  catch (e) {
    if (e.code != "ENOENT")
      throw e;
    else
      return;
  }

  var cacheToken = stats.mtime.getTime();

  return [ route + ".js?v=" + cacheToken ];
};

jsCompiler.compile = function (directory, route, build, callback) {
  var filename = path.normalize(directory + "/" + route + ".js");

  fs.readFile(filename, "utf-8", function (err, data) {
    if (err) {
      if (err.code == "ENOENT") {
        return callback(null, false);
      }
      
      return callback(err);
    }

    if (build)
    {
      var result = uglify.minify(data, {fromString: true});
      return callback(null, true, result.code);
    }

    return callback(null, true, data);
  });
};