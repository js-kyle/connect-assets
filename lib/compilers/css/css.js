var path = require("path");
var fs = require("fs");
var sqwish = require("sqwish");

var cssCompiler = module.exports = {};

cssCompiler.getOrderedFileList = function (directory, route, build) {
  var filename = path.normalize(directory + "/" + route + ".css");
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

  return [ route + ".css?v=" + cacheToken ];
};

cssCompiler.compile = function (directory, route, build, callback) {
  var filename = path.normalize(directory + "/" + route + ".css");

  fs.readFile(filename, "utf-8", function (err, data) {
    if (err) {
      if (err.code == "ENOENT") {
        return callback(null, false);
      }
      
      return callback(err);
    }
    if (!build) return callback(null, true, data);
    return callback(null, true, sqwish.minify(data));
  });
};