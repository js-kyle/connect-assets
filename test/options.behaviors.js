var mocha = require("mocha");
var expect = require("expect.js");
var behaviors = module.exports = {};
var connectAssets = require("../index");

behaviors.allows_overrides = function (property) {
  it("can be overridden", function () {
    var options = {};
    options[property] = "aj29fd";

    var resultingOptions = connectAssets.parseOptions(options);

    expect(resultingOptions[property]).to.be("aj29fd");
  });
};