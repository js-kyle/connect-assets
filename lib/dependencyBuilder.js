var fs = require("fs");
var path = require("path");
var async = require("async");
var compilers = require("./compilers");

var ignored = [".", ".."];

var shouldBuild = false;

var scanDirectory = function (dir, callback) {
  fs.readdir(dir, function (err, paths) {
    if (err) return callback(err);
    var fns = {};

    for (var i = 0; i < paths.length; i++) {
      fns[paths[i]] = scanDirectoryItem(dir + path.sep + paths[i]);
    };

    async.parallel(fns, callback);
  });
};

var scanDirectoryItem = function (item) {
  return function (callback) {
    fs.stat(item, function (err, stats) {
      if (err) return callback(err);
      if (stats.isFile()) return scanFile(item, callback);
      if (stats.isDirectory()) return scanDirectory(item, callback);
    });
  };
};

var scanFile = function (file, callback) {
  var extension = path.extname(file).substring(1);
  var compiler = compilers.js[extension] || compilers.css[extension];

  if (!compiler) 
    return callback(null, null);

  compiler.getOrderedFileList(file, shouldBuild, callback);
};


scanDirectory("assets", function (err, routes) {
  if (err) throw err;
  console.log(routes);
});