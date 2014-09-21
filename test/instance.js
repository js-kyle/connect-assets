var expect = require("expect.js");
var mocha = require("mocha");
var connectAssets = require("..");

describe("instance", function () {
  it("exposes the mincer environment", function () {
    var assets = connectAssets();

    expect(assets.environment).to.be.an("object");
  });

  it("allows you to call .bind()", function () {
    var assets = connectAssets();

    expect(assets.bind).to.be.a("function");
  });

  it("allows you to call .apply()", function () {
    var assets = connectAssets();

    expect(assets.apply).to.be.an("function");
  });
});
