var mocha = require("mocha");
var expect = require("expect.js");
var behaviors = module.exports = {};

behaviors.prepends_type = function (type) {

  it("prepends the type of asset to the URL (css, js)", function () {
    var expected = "/" + type + "/some/path." + type;
    var actual = this[type]("some/path");

    expect(actual).to.be(expected);
  });

};