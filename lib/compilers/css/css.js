var path = require("path");
var fs = require("fs");
var path = require("path");
var sqwish = require("sqwish");

var cssCompiler = module.exports = {};

cssCompiler.getOrderedFileList = function (file, shouldBuild, callback) {
  var extension = path.extname(file);
  var route = file.replace(extension, "");

  fs.stat(file, function (err, stats) {
    if (err) return callback(err);
    var cacheToken = stats.mtime.getTime();

    callback(null, [ route + ".css?v=" + cacheToken ]);
  })
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