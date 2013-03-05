var expect = require("expect.js");
var mocha = require("mocha");

var connectAssets = require("../../index");

describe("lib/assets", function () {

  describe("middleware", function () {

    it("serves files using a far-future header");

    it("uses content-type: text/javascript for .js files");

    it("uses content-type: text/css for .css files");

    it("doesn't require using the css() or js() functions to serve assets");

  });

  describe("css view helper", function () {

    beforeEach(function () {
      connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      });
    });

    it("prepends the asset folder to the URL (css)", function () {
      var expected = "/css/some/path.css";
      var actual = this.css("some/path");

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to full URLs (http://example.com)", function () {
      var expected = "http://example.com/test.css";
      var actual = this.css(expected);

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to almost full URLs (//example.com)", function () {
      var expected = "//example.com/test.css";
      var actual = this.css(expected);

      expect(actual).to.be(expected);
    });
    
  });

  describe("js view helper", function () {

    beforeEach(function () {
      connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      });
    });

    it("prepends the asset folder to the URL (js)", function () {
      var expected = "/js/some/path.js";
      var actual = this.js("some/path");

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to full URLs (http://example.com)", function () {
      var expected = "http://example.com/test.js";
      var actual = this.js(expected);

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to almost full URLs (//example.com)", function () {
      var expected = "//example.com/test.js";
      var actual = this.js(expected);

      expect(actual).to.be(expected);
    });
    
  });

});