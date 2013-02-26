var expect = require("expect.js");
var mocha = require("mocha");
var behaviors = require("./tagWriters.behaviors.js");

var xHtml5Writer = require("../../../../lib/tagWriters/xHtml5Writer");

describe("lib/tagWriters/xHtml5Writer", function () {

  behaviors.has_proper_functions(xHtml5Writer);

  describe("jsTag", function () {

    it("renders XHTML5-compliant tags", function () {
      var expected = "<script src=\"/some/path.js\"></script>";
      var actual = xHtml5Writer.jsTag("/some/path.js");

      expect(actual).to.be(expected);
    });

    it("renders defer=\"defer\" when { defer: true } is passed", function () {
      var expected = "<script defer=\"defer\" src=\"/some/path.js\"></script>";
      var actual = xHtml5Writer.jsTag("/some/path.js", { defer: true });

      expect(actual).to.be(expected);
    });

    it("renders async=\"async\" when { async: true } is passed", function () {
      var expected = "<script async=\"async\" src=\"/some/path.js\"></script>";
      var actual = xHtml5Writer.jsTag("/some/path.js", { async: true });

      expect(actual).to.be(expected);
    });

    it("renders defer=\"defer\" when { async: true, defer: true } is passed", function () {
      var expected = "<script defer=\"defer\" src=\"/some/path.js\"></script>";
      var actual = xHtml5Writer.jsTag("/some/path.js", { async: true, defer: true });

      expect(actual).to.be(expected);
    });

  });

  describe("cssTag", function () {

    it("renders XHTML5-compliant tags", function () {
      var expected = "<link rel=\"stylesheet\" href=\"/some/path.css\" />";
      var actual = xHtml5Writer.cssTag("/some/path.css");

      expect(actual).to.be(expected);
    });

  });

});