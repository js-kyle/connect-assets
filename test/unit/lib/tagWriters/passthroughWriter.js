var expect = require("expect.js");
var mocha = require("mocha");
var behaviors = require("./tagWriters.behaviors.js");

var passthroughWriter = require("../../../../lib/tagWriters/passthroughWriter");

describe("lib/tagWriters/passthroughWriter", function () {

  behaviors.has_proper_functions(passthroughWriter);

  describe("jsTag", function () {

    it("returns the path untouched", function () {
      var path = "/some/path.js";
      var result = passthroughWriter.jsTag(path);

      expect(result).to.be(path);
    });

  });

  describe("cssTag", function () {

    it("returns the path untouched", function () {
      var path = "/some/path.css";
      var result = passthroughWriter.cssTag(path);

      expect(result).to.be(path);
    });

  });

});