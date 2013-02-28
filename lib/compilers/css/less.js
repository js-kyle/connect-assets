var path = require("path");
var fs = require("fs");
var less = require("less");

var lessCompiler = module.exports = {};

lessCompiler.getOrderedFileList = function (directory, route, build) {
  var filename = path.normalize(directory + "/" + route + ".less");
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

lessCompiler.compile = function (directory, route, build, callback) {
  var filename = path.normalize(directory + "/" + route + ".less");
  var dirname = path.dirname(filename);

  fs.readFile(filename, "utf-8", function (err, data) {
    if (err) {
      if (err.code == "ENOENT") {
        return callback(null, false);
      }
      
      return callback(err);
    }

    console.log(directory);

    less.render(data, { paths: [dirname] }, function (err, css) {
      if (err) {
        return callback(err);
      }

      return callback(null, true, css);
    });
  });
};