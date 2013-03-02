var expect = require("expect.js");
var mocha = require("mocha");

var connectAssets = require("../../index");

describe("css helper", function () {

  beforeEach(function () {
    connectAssets({
      src: "test/integration/assets",
      pathsOnly: true,
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