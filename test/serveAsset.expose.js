var expect = require("expect.js");
var mocha = require("mocha");
var connectAssets = require("..");
var Assets = require("../lib/assets");

describe("connectAssets expose", function () {

  it("should be Assets instance", function () {
    assets = connectAssets();
    expect(assets instanceof Assets).to.equal(true);
  });

});
