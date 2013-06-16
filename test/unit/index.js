var expect = require("expect.js");
var mocha = require("mocha");
var behaviors = require("./index.behaviors");
var they = it;

var connectAssets = require("../../index");

describe("index: options", function () {

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

  describe(".tagWriter", function () {

    it("defaults to 'xHtml5Writer'", function () {
      var options = connectAssets.parseOptions({});
      expect(options.tagWriter).to.be("xHtml5Writer");
    });

    behaviors.allows_overrides("tagWriter");

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

  describe(".saveToDisk", function () {

    it("defaults to 'false' when not in production", function () {
      var options = connectAssets.parseOptions({ env: "not-production" });
      expect(options.saveToDisk).to.be(false);
    });

    it("defaults to 'true' in production", function () {
      var options = connectAssets.parseOptions({ env: "production" });
      expect(options.saveToDisk).to.be(true);
    });

    behaviors.allows_overrides("saveToDisk");

  });

  describe(".assetFolders", function () {

    it("defaults to { css: 'css', js: 'js' }", function () {
      var options = connectAssets.parseOptions({});
      expect(options.assetFolders).to.eql({ css: "css", js: "js" });
    });

    it("allows .css to be overridden with keeping default value for .js", function () {
      var options = connectAssets.parseOptions({
        assetFolders: { css: "styles" }
      });
      expect(options.assetFolders).to.eql({ css: "styles", js: "js" });
    });

    it("allows .js to be overridden with keeping default value for .css", function () {
      var options = connectAssets.parseOptions({
        assetFolders: { js: "scripts" }
      });
      expect(options.assetFolders).to.eql({ css: "css", js: "scripts" });
    });

    it("allows .css and .js to be overridden", function () {
      var options = connectAssets.parseOptions({
        assetFolders: { css: "styles", js: "scripts" }
      });
      expect(options.assetFolders).to.eql({ css: "styles", js: "scripts" });
    });
    
  });

  describe(".compilers", function () {

    it("supports javascript by default", function () {
      var options = connectAssets.parseOptions({});
      expect(options.compilers.js).to.be.ok();
    });

    it("supports coffeescript by default");

    it("supports stylus by default", function () {
      var options = connectAssets.parseOptions({});
      expect(options.compilers.styl).to.be.ok();
    });

    it("supports less by default", function () {
      var options = connectAssets.parseOptions({});
      expect(options.compilers.less).to.be.ok();
    });

    it("allows adding a new compiler without replacing defaults", function () {
      var options = connectAssets.parseOptions({ compilers: { ts: {} } });
      expect(options.compilers.js).to.be.ok();
      expect(options.compilers.ts).to.be.ok();
    });

    it("allows overriding default compilers", function () {
      var options = connectAssets.parseOptions({ compilers: { js: "e" } });
      expect(options.compilers.js).to.be("e");
    });

  });
  
});

