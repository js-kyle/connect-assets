var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var os = require("os");

var behaviors =  require("./behaviors");

var DiskCache = require("../../../lib/caches/disk");

describe("lib/caches/disk", function () {

  beforeEach(function () {
    this.cache = new DiskCache({
      buildDir: os.tmpDir() + Math.random() 
    });
  });

  behaviors.cache();

});
