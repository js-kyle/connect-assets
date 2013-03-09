var path = require("path");
var fs = require("fs");
var path = require("path");
var sqwish = require("sqwish");

var cssCompiler = module.exports = {};

cssCompiler.getOrderedFileList = function (folder, file, shouldBuild, callback) {
  fs.stat(folder + file, function (err, stats) {
    if (err) return callback(err);
    var cacheToken = stats.mtime.getTime();
    return callback(null, [{ filename: file, route: file, version: cacheToken }]);
  });
};

cssCompiler.compile = function (file, shouldBuild, callback) {
  fs.readFile(file, "utf-8", function (err, data) {
    if (err) return callback(err);
    if (!shouldBuild) return callback(null, data);
    return callback(null, sqwish.minify(data));
  });
};