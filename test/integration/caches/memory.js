var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");

var behaviors =  require("./behaviors");

var MemoryCache = require("../../../lib/caches/memory");

describe("lib/caches/memory", function () {

  beforeEach(function () {
    this.cache = new MemoryCache();
  });

  behaviors.cache();

});
