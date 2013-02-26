var expect = require("expect.js");
var mocha = require("mocha");
var behaviors = require("./options.behaviors");
var they = it;

var connectAssets = require("../index");

describe("options", function () {

  they("are not required", function () {
    var instance = connectAssets();
    expect(instance).to.be.ok();
  });

  describe(".env", function () {

    it("defaults to 'process.env.NODE_ENV'", function () {
      var previously = process.env.NODE_ENV;
      process.env.NODE_ENV = "asdf";

      var options = connectAssets.parseOptions({});

      expect(options.env).to.be("asdf");
      process.env.NODE_ENV = previously;
    });

    behaviors.allows_overrides("env");

  });

  describe(".src", function () {

    it("defaults to 'assets'", function () {
      var options = connectAssets.parseOptions({});
      expect(options.src).to.be("assets");
    });

    behaviors.allows_overrides("src");

  });

  describe(".helperContext", function () {

    it("defaults to 'global'", function () {
      var options = connectAssets.parseOptions({});
      expect(options.helperContext).to.be(global);
    });

    behaviors.allows_overrides("helperContext");

  });

  describe(".buildDir", function () {

    it("defaults to 'builtAssets'", function () {
      var options = connectAssets.parseOptions({});
      expect(options.buildDir).to.be("builtAssets");
    });

    behaviors.allows_overrides("buildDir");

  });

  describe(".build", function () {

    it("defaults to 'false' when not in production", function () {
      var options = connectAssets.parseOptions({ env: "not-production" });
      expect(options.build).to.be(false);
    });

    it("defaults to 'true' in production", function () {
      var options = connectAssets.parseOptions({ env: "production" });
      expect(options.build).to.be(true);
    });

    behaviors.allows_overrides("build");

  });

  describe(".detectChanges", function () {

    it("defaults to 'true' when not in production", function () {
      var options = connectAssets.parseOptions({ env: "not-production" });
      expect(options.detectChanges).to.be(true);
    });

    it("defaults to 'false' in production", function () {
      var options = connectAssets.parseOptions({ env: "production" });
      expect(options.detectChanges).to.be(false);
    });

    behaviors.allows_overrides("detectChanges");

  });

  describe(".jsCompilers", function () {

    it("supports javascript by default");
    it("supports coffeescript by default");
    it("allows adding new compilers without replacing defaults");
    it("allows overriding default compilers");

  });

  describe(".cssCompilers", function () {

    it("supports stylus by default");
    it("supports less by default");
    it("allows adding new compilers without replacing defaults");
    it("allows overriding default compilers");

  });
  
});

