var mocha = require("mocha");
var expect = require("expect.js");
var behaviors = module.exports = {};

behaviors.has_proper_functions = function (writer) {
  it("has a cssTag function", function () {
    expect(writer).to.be.ok();
    expect(writer.cssTag).to.be.a(Function);
  });

  it("has a jsTag function", function () {
    expect(writer).to.be.ok();
    expect(writer.jsTag).to.be.a(Function);
  });
};