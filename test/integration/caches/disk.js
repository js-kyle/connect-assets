var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var os = require("os");
var path = require("path");

var behaviors =  require("./behaviors");

var DiskCache = require("../../../lib/caches/disk");

describe("lib/caches/disk", function () {

  beforeEach(function () {
    this.cache = new DiskCache({
      buildDir: path.normalize(os.tmpDir() + path.sep + Math.random())
    });
  });

  behaviors.cache();

});
