var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");

describe("configureCallback", function () {
  it("isn't required to be passed", function () {
    var middleware = assets({ helperContext: {} });
    expect(middleware).to.be.ok();
  });

  it("can be passed as a second argument and is executed synchronously", function () {
    var hasBeenCalled = false;
    var middleware = assets({ helperContext: {} }, function () {
      hasBeenCalled = true;
    });
    expect(hasBeenCalled).to.equal(true);
  });
});
