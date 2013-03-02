var path = require("path");
var fs = require("fs");
var less = require("less");

var lessCompiler = module.exports = {};

lessCompiler.getOrderedFileList = function (file, shouldBuild, callback) {
  fs.stat(file, function (err, stats) {
    if (err) return callback(err);
    var cacheToken = stats.mtime.getTime();
    return callback(null, [{ 
      filename: file,
      route: file.replace(".less", ".css"), 
      version: cacheToken 
    }]);
  });
};

lessCompiler.compile = function (file, shouldBuild, callback) {
  var dir = path.dirname(file);

  fs.readFile(file, "utf-8", function (err, data) {
    if (err) return callback(err);
    
    less.render(data, { paths: [dir], compress: shouldBuild }, function (err, css) {
      if (err) return callback(err);
      return callback(null, css);
    });
  });
};